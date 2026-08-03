from __future__ import annotations

import re
from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding="utf-8")


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count != expected:
        raise RuntimeError(f"{path}: expected {expected} occurrence(s), found {count}: {old[:100]!r}")
    write(path, content.replace(old, new))


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count < minimum:
        raise RuntimeError(f"{path}: expected at least {minimum} occurrence(s), found {count}: {old!r}")
    write(path, content.replace(old, new))


def regex_replace(path: str, pattern: str, replacement: str, expected: int = 1) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, flags=re.DOTALL)
    if count != expected:
        raise RuntimeError(f"{path}: expected {expected} regex replacement(s), found {count}: {pattern}")
    write(path, updated)


# Frontend response contract and deterministic preview.
model = "frontend/src/dashboard-model.ts"
replace(model, "  deliveredMessages: number;", "  publishedMessages: number;")
replace(model, "  latestProcessedAt: string | null;", "  latestPublishedAt: string | null;")
replace(model, "    totalSteps: 6,", "    totalSteps: 5,")
replace(
    model,
    "      { id: 'inspect-proof', label: 'Inspect audit and delivery proof', description: 'Live proof requires the API, database, and outbox.', workspace: 'audit', state: 'pending' }\n",
    ""
)
replace(model, "      deliveredMessages: 0,", "      publishedMessages: 0,")
replace(model, "      latestProcessedAt: null", "      latestPublishedAt: null")

replace("frontend/src/operational-refresh.store.spec.ts", "      deliveredMessages: 0", "      publishedMessages: 0")
replace("frontend/src/portfolio-scenario.controller.spec.ts", "  totalSteps: 6,", "  totalSteps: 5,")

# App component state, date anchoring, truthful outbox copy, and real count KPIs.
component = "frontend/src/app.component.ts"
replace(
    component,
    "import { PortfolioScenarioController } from './portfolio-scenario.controller';",
    "import { PortfolioScenarioController } from './portfolio-scenario.controller';\nimport { resolveInitialScheduleDate } from './schedule-date';"
)
replace(
    component,
    "function defaultProofLayerOpen(): boolean {\n  return typeof window === 'undefined' || !window.matchMedia('(max-width: 1379px)').matches;\n}",
    "function defaultProofLayerOpen(): boolean {\n  return false;\n}"
)
replace_all(component, "this.selectedScheduleDate()", "this.effectiveScheduleDate()", minimum=7)
replace(
    component,
    "  readonly selectedScheduleDate = signal<Date>(startOfDay(new Date()));",
    "  readonly selectedScheduleDate = signal<Date | null>(null);\n  readonly effectiveScheduleDate = computed(() => resolveInitialScheduleDate(this.dashboard().appointments, this.selectedScheduleDate()));"
)
replace_all(component, ".deliveredMessages", ".publishedMessages", minimum=4)
replace(component, "if (this.dashboard().outbox.pendingMessages > 0) return { label: 'Pending delivery'", "if (this.dashboard().outbox.pendingMessages > 0) return { label: 'Pending publication'")
replace(component, "return { label: 'Delivered', detail: `${this.dashboard().outbox.publishedMessages} messages published`", "return { label: 'Published', detail: `${this.dashboard().outbox.publishedMessages} broker-confirmed messages`")
replace(component, "{ title: 'Outbox delivery'", "{ title: 'Outbox publication'")
replace(component, "`${outbox.publishedMessages} delivered · ${outbox.pendingMessages} pending`", "`${outbox.publishedMessages} published · ${outbox.pendingMessages} pending`")
replace(
    component,
    "  startScenario(): void {\n    this.selectView(this.scenarioController.start());\n  }",
    "  startScenario(): void {\n    this.selectedScheduleDate.set(null);\n    this.selectView(this.scenarioController.start());\n  }"
)
replace(
    component,
    "  resetScenario(): void {\n    this.selectView(this.scenarioController.reset());\n  }",
    "  resetScenario(): void {\n    this.selectedScheduleDate.set(null);\n    this.selectView(this.scenarioController.reset());\n  }"
)
regex_replace(
    component,
    r"  readonly auditSummary = computed\(\(\) => \{.*?\n  \}\);\n  readonly auditCards",
    """  readonly auditSummary = computed(() => {
    const telemetry = this.auditTelemetry();
    const outbox = this.dashboard().outbox;
    const categoryCount = (label: string) => telemetry.categories.find(item => item.label === label)?.count ?? 0;
    return [
      { label: 'Audit events', value: `${telemetry.eventsToday}`, detail: 'Current persisted snapshot', tone: 'cyan' as const },
      { label: 'Appointment events', value: `${categoryCount('Appointments')}`, detail: 'Persisted transitions', tone: 'blue' as const },
      { label: 'Documentation events', value: `${categoryCount('Documentation')}`, detail: 'Persisted transitions', tone: 'violet' as const },
      { label: 'Claim events', value: `${categoryCount('Claims')}`, detail: 'Persisted transitions', tone: 'amber' as const },
      { label: 'Outbox published', value: `${outbox.publishedMessages}`, detail: 'Broker-confirmed messages', tone: 'green' as const },
      { label: 'Outbox pending', value: `${outbox.pendingMessages}`, detail: outbox.pendingMessages ? 'Waiting for publication' : 'Queue clear', tone: outbox.pendingMessages ? 'amber' as const : 'green' as const }
    ];
  });
  readonly auditCards"""
)

# Template copy and response-property bindings.
template = "frontend/src/app.component.html"
replace_all(template, ".deliveredMessages", ".publishedMessages", minimum=1)
replace(template, "proof steps complete", "persisted transitions complete")
replace(template, "truthful transactional outbox delivery state", "truthful transactional outbox publication state")
replace(template, "transactional outbox delivery.", "transactional outbox publication.")
replace(template, "RabbitMQ outbox delivery", "RabbitMQ outbox publication")
replace(template, "Runtime and delivery state", "Runtime and publication state")
replace(template, "<span>Delivered</span>", "<span>Published</span>")
replace(template, "<span>Delivery result</span>", "<span>Publication result</span>")

# Derive the audit spectrum from event timestamps rather than event hashes.
telemetry = "frontend/src/operational-telemetry.ts"
regex_replace(
    telemetry,
    r"\nfunction eventHash\(event: AuditEvent\): number \{.*?\n\}\n\nexport function buildAuditTelemetry",
    "\nexport function buildAuditTelemetry"
)
regex_replace(
    telemetry,
    r"  const spectrumSource = dashboard\.audit\.length === 0.*?\n  \}\);",
    """  const spectrum = Array.from({ length: 72 }, () => 0);
  if (dashboard.audit.length > 0) {
    const timestamps = dashboard.audit.map(event => new Date(event.occurredAt).getTime());
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    const span = Math.max(1, latest - earliest);
    dashboard.audit.forEach((event, eventIndex) => {
      const timestamp = new Date(event.occurredAt).getTime();
      const bucket = latest === earliest
        ? Math.min(71, eventIndex)
        : Math.min(71, Math.floor(((timestamp - earliest) / span) * 71));
      spectrum[bucket] += 1;
    });
    const peak = Math.max(...spectrum, 1);
    spectrum.forEach((count, index) => {
      spectrum[index] = count === 0 ? 0 : 20 + Math.round((count / peak) * 77);
    });
  }"""
)

# Full-stack acceptance: five persisted transitions, published terminology, and routed queue proof.
ci = ".github/workflows/ci.yml"
replace_all(ci, "deliveredMessages", "publishedMessages", minimum=2)
replace(ci, "(f\"/api/claims/{scenario['claimId']}/status\", 'Submitted', 6),", "(f\"/api/claims/{scenario['claimId']}/status\", 'Submitted', 5),")
replace(
    ci,
    "      - name: Print service logs on failure\n",
    """      - name: Verify RabbitMQ routing proof
        run: |
          docker compose exec -T rabbitmq rabbitmqctl list_queues name messages --quiet |
            grep -E '^practiceops\\.portfolio\\.audit[[:space:]]+5$'

      - name: Print service logs on failure
"""
)

# Visual regression gates for the final hierarchy and accessibility pass.
visual = ".github/workflows/visual-audit.yml"
anchor = "            assert((await evaluate(`document.querySelector('.mode-notice')?.textContent`)).includes('Synthetic preview'), 'Synthetic fallback notice is missing.');\n"
insert = """            const polishState = await evaluate(`(() => {
              const focusTarget = document.querySelector('.refresh-control');
              focusTarget?.focus();
              const focusStyle = focusTarget ? getComputedStyle(focusTarget) : null;
              const kicker = document.querySelector('.panel-kicker');
              const primary = document.querySelector('.scenario-primary');
              return {
                focusOutline: focusStyle?.outlineStyle,
                focusShadow: focusStyle?.boxShadow,
                kickerSize: kicker ? parseFloat(getComputedStyle(kicker).fontSize) : 0,
                primaryHeight: primary?.getBoundingClientRect().height ?? 0
              };
            })()`);
            assert(polishState.kickerSize >= 10, `Operational microcopy is too small: ${JSON.stringify(polishState)}`);
            assert(polishState.primaryHeight >= 40, `Primary action target is too short: ${JSON.stringify(polishState)}`);
            assert(polishState.focusOutline !== 'none' || polishState.focusShadow !== 'none', `Keyboard focus is not visible: ${JSON.stringify(polishState)}`);
"""
replace(visual, anchor, anchor + insert)
mobile_anchor = "              assert(navCount === 6, `Mobile navigation has ${navCount} destinations.`);\n              await screenshot(`${view.id}-mobile.png`);"
mobile_insert = """              assert(navCount === 6, `Mobile navigation has ${navCount} destinations.`);
              if (view.id === 'overview') {
                const mobilePolish = await evaluate(`(() => {
                  const rail = document.querySelector('.scenario-rail');
                  const workspace = document.querySelector('.workspace');
                  return {
                    railHeight: rail?.getBoundingClientRect().height ?? 0,
                    workspacePaddingBottom: workspace ? parseFloat(getComputedStyle(workspace).paddingBottom) : 0
                  };
                })()`);
                assert(mobilePolish.railHeight < 360, `Mobile journey rail is too tall: ${JSON.stringify(mobilePolish)}`);
                assert(mobilePolish.workspacePaddingBottom >= 100, `Mobile navigation safe area is missing: ${JSON.stringify(mobilePolish)}`);
              }
              await screenshot(`${view.id}-mobile.png`);"""
replace(visual, mobile_anchor, mobile_insert)

# Documentation terminology.
for path in ["README.md", "docs/portfolio-demo.md"]:
    replace_all(path, "delivered outbox messages", "published outbox messages", minimum=1)
    content = read(path)
    content = content.replace("Outbox delivery", "Outbox publication")
    content = content.replace("outbox delivery", "outbox publication")
    content = content.replace("delivered or pending", "published or pending")
    content = content.replace("reported as delivered", "reported as published")
    content = content.replace("delivery state", "publication state")
    content = content.replace("delivery result", "publication result")
    content = content.replace("Delivered only", "Published only")
    write(path, content)

# Final guardrails.
for path in [model, component, template, ci]:
    content = read(path)
    if "deliveredMessages" in content:
        raise RuntimeError(f"{path}: stale deliveredMessages reference remains")

print("Final audited polish transformations applied successfully.")
