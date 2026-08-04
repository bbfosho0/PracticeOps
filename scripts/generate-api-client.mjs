import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const apiDirectory = join(root, 'backend', 'PracticeOps.Api');
const openApiPath = join(apiDirectory, 'openapi.json');
const generatedClientPath = join(root, 'frontend', 'src', 'generated', 'practiceops-api-client.ts');
const checkOnly = process.argv.includes('--check');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
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

async function exportOpenApi() {
  const endpoint = 'http://127.0.0.1:8081/swagger/v1/swagger.json';
  let lastError;

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const document = await response.text();
        mkdirSync(dirname(openApiPath), { recursive: true });
        writeFileSync(openApiPath, document, 'utf8');
        return;
      }
      lastError = new Error(`OpenAPI endpoint returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 2_000));
  }

  throw new Error(`The PracticeOps OpenAPI document did not become available. ${lastError?.message ?? ''}`);
}

try {
  run('dotnet', ['tool', 'restore']);
  run('docker', ['compose', 'up', '--build', '--detach', 'postgres', 'rabbitmq', 'api']);
  await exportOpenApi();

  const nswagDll = findNswagDll(readToolVersion());
  run('dotnet', [nswagDll, 'run', 'nswag.json'], { cwd: apiDirectory });

  if (!existsSync(generatedClientPath)) {
    throw new Error(`NSwag did not create ${generatedClientPath}.`);
  }

  if (checkOnly) {
    run('git', ['diff', '--exit-code', '--', 'frontend/src/generated/practiceops-api-client.ts']);
  }
} finally {
  rmSync(openApiPath, { force: true });
  const cleanup = spawnSync('docker', ['compose', 'down', '--volumes', '--remove-orphans'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (cleanup.status !== 0) {
    console.error('Warning: Docker Compose cleanup failed.');
  }
}
