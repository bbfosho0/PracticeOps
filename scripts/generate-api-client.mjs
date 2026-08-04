import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { get } from 'node:http';

const root = resolve(import.meta.dirname, '..');
const apiDirectory = join(root, 'backend', 'PracticeOps.Api');
const openApiPath = join(apiDirectory, 'openapi.json');
const generatedClientPath = join(root, 'frontend', 'src', 'generated', 'practiceops-api-client.ts');
const checkOnly = process.argv.includes('--check');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'practiceops-api-contract-'));
const generatedCandidatePath = join(temporaryDirectory, 'practiceops-api-client.ts');
const composePath = join(temporaryDirectory, 'compose.json');
const composeProject = `practiceops-api-contract-${process.pid}`;
let contractStackStarted = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    ...options,
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
  return result.stdout.trim();
}

function readToolVersion() {
  const manifest = JSON.parse(readFileSync(join(root, '.config', 'dotnet-tools.json'), 'utf8'));
  const version = manifest.tools?.['nswag.consolecore']?.version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('The NSwag version is missing from .config/dotnet-tools.json.');
  }
  return version;
}

function findNswagDll(version) {
  const packageRoot = join(homedir(), '.nuget', 'packages', 'nswag.consolecore', version, 'tools', 'net8.0');
  const candidates = [
    join(packageRoot, 'any', 'dotnet-nswag.dll'),
    join(packageRoot, 'dotnet-nswag.dll'),
  ];
  const dll = candidates.find(existsSync);
  if (!dll) {
    throw new Error(`Unable to find the pinned .NET 8 NSwag assembly below ${packageRoot}. Run dotnet tool restore first.`);
  }
  return dll;
}

function writeContractComposeFile() {
  const compose = {
    services: {
      postgres: {
        image: 'postgres:16-alpine',
        environment: {
          POSTGRES_DB: 'practiceops',
          POSTGRES_USER: 'practiceops',
          POSTGRES_PASSWORD: 'practiceops'
        },
        healthcheck: {
          test: ['CMD-SHELL', 'pg_isready -U practiceops -d practiceops'],
          interval: '2s',
          timeout: '5s',
          retries: 30
        },
        volumes: ['contract-postgres:/var/lib/postgresql/data']
      },
      rabbitmq: {
        image: 'rabbitmq:4-management-alpine',
        healthcheck: {
          test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping'],
          interval: '5s',
          timeout: '5s',
          retries: 20,
          start_period: '10s'
        }
      },
      api: {
        build: {
          context: root,
          dockerfile: 'backend/PracticeOps.Api/Dockerfile'
        },
        environment: {
          ConnectionStrings__PracticeOps: 'Host=postgres;Port=5432;Database=practiceops;Username=practiceops;Password=practiceops',
          RabbitMq__Host: 'rabbitmq',
          ASPNETCORE_URLS: 'http://+:8080'
        },
        ports: ['127.0.0.1::8080'],
        depends_on: {
          postgres: { condition: 'service_healthy' },
          rabbitmq: { condition: 'service_healthy' }
        }
      }
    },
    volumes: { 'contract-postgres': {} }
  };
  writeFileSync(composePath, `${JSON.stringify(compose, null, 2)}\n`, 'utf8');
}

function startContractStack() {
  writeContractComposeFile();
  contractStackStarted = true;
  run('docker', ['compose', '-f', composePath, '-p', composeProject, 'up', '--build', '--detach']);
  const publishedAddress = runCapture(
    'docker',
    ['compose', '-f', composePath, '-p', composeProject, 'port', 'api', '8080']
  ).replace(/^0\.0\.0\.0:/, '127.0.0.1:');
  return `http://${publishedAddress}/swagger/v1/swagger.json`;
}

async function exportOpenApi(endpoint) {
  let lastError;

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await download(endpoint);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        mkdirSync(dirname(openApiPath), { recursive: true });
        writeFileSync(openApiPath, response.body, 'utf8');
        return;
      }
      lastError = new Error(`OpenAPI endpoint returned HTTP ${response.statusCode}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 2_000));
  }

  throw new Error(`The PracticeOps OpenAPI document did not become available. ${lastError?.message ?? ''}`);
}

function download(endpoint) {
  return new Promise((resolveDownload, rejectDownload) => {
    const request = get(endpoint, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolveDownload({
        statusCode: response.statusCode ?? 0,
        body
      }));
    });
    request.setTimeout(5_000, () => request.destroy(new Error('OpenAPI request timed out.')));
    request.on('error', rejectDownload);
  });
}

function assertGeneratedClientIsCurrent(candidatePath) {
  if (!existsSync(generatedClientPath)) {
    throw new Error(`The committed generated client is missing: ${generatedClientPath}`);
  }

  const committed = normalizeNewLines(readFileSync(generatedClientPath, 'utf8'));
  const candidate = normalizeNewLines(readFileSync(candidatePath, 'utf8'));
  if (committed !== candidate) {
    throw new Error('Generated API client drift detected. Run npm --prefix frontend run api:generate and commit the result.');
  }
}

function normalizeNewLines(value) {
  return value.replaceAll('\r\n', '\n');
}

try {
  run('dotnet', ['tool', 'restore']);
  const endpoint = startContractStack();
  await exportOpenApi(endpoint);

  const nswagDll = findNswagDll(readToolVersion());
  const outputPath = checkOnly ? generatedCandidatePath : generatedClientPath;
  mkdirSync(dirname(outputPath), { recursive: true });
  run('dotnet', [
    nswagDll,
    'run',
    'nswag.json',
    `/variables:ClientOutput=${outputPath.replaceAll('\\', '/')}`
  ], { cwd: apiDirectory });

  if (!existsSync(outputPath)) {
    throw new Error(`NSwag did not create ${outputPath}.`);
  }

  if (checkOnly) {
    assertGeneratedClientIsCurrent(outputPath);
    console.log('Generated API client matches the committed contract.');
  }
} finally {
  rmSync(openApiPath, { force: true });
  let cleanupFailed = false;
  if (contractStackStarted) {
    const cleanup = spawnSync(
      'docker',
      ['compose', '-f', composePath, '-p', composeProject, 'down', '--volumes', '--remove-orphans'],
      { cwd: root, stdio: 'inherit' }
    );
    if (cleanup.status !== 0) {
      console.error(`Warning: isolated Docker Compose cleanup failed for project ${composeProject}.`);
      cleanupFailed = true;
    }
  }
  if (cleanupFailed) {
    console.error(`Temporary Compose definition retained at ${composePath}.`);
  } else {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
