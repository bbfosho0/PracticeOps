from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
SRC = FRONTEND / "src"
WORKFLOW = ROOT / ".github" / "workflows" / "tailwind-hybrid-bootstrap.yml"
SCRIPT = Path(__file__).resolve()


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"Expected replacement marker not found in {path}: {old[:100]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def configure_packages() -> None:
    package_path = FRONTEND / "package.json"
    package = json.loads(package_path.read_text(encoding="utf-8"))
    dev = package.setdefault("devDependencies", {})
    dev["@tailwindcss/postcss"] = "4.3.3"
    dev["postcss"] = "8.5.23"
    dev["tailwindcss"] = "4.3.3"
    package["devDependencies"] = dict(sorted(dev.items()))
    write(package_path, json.dumps(package, indent=2))

    write(
        FRONTEND / ".postcssrc.json",
        json.dumps({"plugins": {"@tailwindcss/postcss": {}}}, indent=2),
    )


def configure_global_theme() -> None:
    path = SRC / "styles.css"
    text = path.read_text(encoding="utf-8")
    if not text.startswith('@import "tailwindcss";'):
        text = '@import "tailwindcss";\n' + text

    if "@theme {" not in text:
        marker = "\n\n:root {"
        theme = """

@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;
  --font-display: \"DM Serif Display\", Georgia, serif;

  --color-obsidian: #04060c;
  --color-ink: #0c1422;
  --color-ink-elevated: #111d30;
  --color-cobalt: #2f6bff;
  --color-cyan: #19d9ff;
  --color-violet: #7a4dff;
  --color-signal: #37e08b;
  --color-warning: #ffb020;
  --color-risk: #ff5f78;
  --color-muted: #8796b1;

  --radius-panel: 1.125rem;
  --radius-control: 0.75rem;
  --shadow-panel: 0 18px 48px rgb(0 0 0 / 0.28);
  --shadow-observatory: 0 28px 80px rgb(0 0 0 / 0.42);
  --breakpoint-3xl: 120rem;
}
"""
        if marker not in text:
            raise RuntimeError("Could not locate :root marker in frontend/src/styles.css")
        text = text.replace(marker, theme + marker, 1)

    path.write_text(text, encoding="utf-8")


def write_tests() -> None:
    write(
        SRC / "risk-topology.spec.ts",
        """import { RiskSlice } from './dashboard-model';
import { buildRiskTopologyNodes } from './risk-topology';

describe('risk topology model', () => {
  const slices: readonly RiskSlice[] = [
    { label: 'Authorization', count: 5, exposure: 7200, tone: 'amber' },
    { label: 'Coding', count: 3, exposure: 4100, tone: 'coral' },
    { label: 'Filing', count: 2, exposure: 2600, tone: 'cyan' },
    { label: 'Payer', count: 2, exposure: 1800, tone: 'violet' }
  ];

  it('returns no nodes when there are no risk slices', () => {
    expect(buildRiskTopologyNodes([])).toEqual([]);
  });

  it('builds deterministic nodes that preserve operational values', () => {
    const first = buildRiskTopologyNodes(slices);
    const second = buildRiskTopologyNodes(slices);

    expect(first).toEqual(second);
    expect(first.map(node => node.count)).toEqual([5, 3, 2, 2]);
    expect(first.map(node => node.exposure)).toEqual([7200, 4100, 2600, 1800]);
    expect(new Set(first.map(node => `${node.x}:${node.y}`)).size).toBe(4);
  });

  it('connects every node from the topology center', () => {
    const nodes = buildRiskTopologyNodes(slices);

    expect(nodes.every(node => node.path.startsWith('M 320 180 Q '))).toBeTrue();
    expect(nodes.every(node => node.radius >= 28 && node.radius <= 42)).toBeTrue();
  });
});
""",
    )


def write_model() -> None:
    write(
        SRC / "risk-topology.ts",
        """import { RiskSlice, SignalTone } from './dashboard-model';

export interface RiskTopologyNode {
  id: string;
  label: string;
  count: number;
  exposure: number;
  tone: SignalTone;
  x: number;
  y: number;
  radius: number;
  path: string;
}

const CENTER_X = 320;
const CENTER_Y = 180;

const NODE_POSITIONS = [
  { x: 130, y: 84 },
  { x: 510, y: 88 },
  { x: 124, y: 276 },
  { x: 516, y: 272 },
  { x: 320, y: 52 },
  { x: 320, y: 308 }
] as const;

function slugify(value: string, index: number): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || `risk-${index + 1}`;
}

export function buildRiskTopologyNodes(slices: readonly RiskSlice[]): readonly RiskTopologyNode[] {
  return slices.map((slice, index) => {
    const position = NODE_POSITIONS[index % NODE_POSITIONS.length];
    const dx = position.x - CENTER_X;
    const dy = position.y - CENTER_Y;
    const controlX = Math.round(CENTER_X + dx * 0.48 - dy * 0.08);
    const controlY = Math.round(CENTER_Y + dy * 0.48 + dx * 0.05);
    const radius = Math.min(42, 28 + Math.round(Math.sqrt(Math.max(0, slice.count)) * 4));

    return {
      id: `${slugify(slice.label, index)}-${index}`,
      label: slice.label,
      count: slice.count,
      exposure: slice.exposure,
      tone: slice.tone,
      x: position.x,
      y: position.y,
      radius,
      path: `M ${CENTER_X} ${CENTER_Y} Q ${controlX} ${controlY} ${position.x} ${position.y}`
    };
  });
}
""",
    )


def write_component() -> None:
    write(
        SRC / "risk-topology.component.ts",
        """import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RiskSlice } from './dashboard-model';
import { buildRiskTopologyNodes } from './risk-topology';

@Component({
  selector: 'app-risk-topology',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './risk-topology.component.html',
  styleUrl: './risk-topology.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskTopologyComponent {
  readonly slices = input.required<readonly RiskSlice[]>();
  readonly totalAtRisk = input.required<number>();
  readonly nodes = computed(() => buildRiskTopologyNodes(this.slices()));
  readonly totalExposure = computed(() => this.slices().reduce((total, slice) => total + slice.exposure, 0));
}
""",
    )

    write(
        SRC / "risk-topology.component.html",
        """<div class="topology-shell">
  <svg class="topology-svg" viewBox="0 0 640 360" role="img" aria-labelledby="risk-topology-title risk-topology-description">
    <title id="risk-topology-title">Claims risk topology</title>
    <desc id="risk-topology-description">{{ totalAtRisk() }} claims are at risk with {{ totalExposure() | currency:'USD':'symbol':'1.0-0' }} in fictional exposure, grouped by operational category.</desc>

    <defs aria-hidden="true">
      <radialGradient id="risk-core-fill" cx="50%" cy="42%" r="68%">
        <stop offset="0%" stop-color="rgba(25, 217, 255, 0.34)" />
        <stop offset="58%" stop-color="rgba(47, 107, 255, 0.16)" />
        <stop offset="100%" stop-color="rgba(4, 6, 12, 0.04)" />
      </radialGradient>
      <filter id="risk-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <g class="topology-grid" aria-hidden="true">
      @for (radius of [64, 116, 166]; track radius) {
        <circle cx="320" cy="180" [attr.r]="radius" />
      }
      <path d="M 86 180 H 554" />
      <path d="M 320 28 V 332" />
    </g>

    <g class="topology-connections" aria-hidden="true">
      @for (node of nodes(); track node.id) {
        <path [attr.d]="node.path" [attr.data-tone]="node.tone" />
      }
    </g>

    <g class="topology-core" filter="url(#risk-soft-glow)" aria-hidden="true">
      <circle class="core-halo" cx="320" cy="180" r="56" />
      <circle class="core-body" cx="320" cy="180" r="43" fill="url(#risk-core-fill)" />
      <text class="core-count" x="320" y="178" text-anchor="middle">{{ totalAtRisk() | number:'1.0-0' }}</text>
      <text class="core-label" x="320" y="199" text-anchor="middle">AT RISK</text>
    </g>

    <g class="topology-nodes" aria-hidden="true">
      @for (node of nodes(); track node.id) {
        <g class="topology-node" [attr.transform]="'translate(' + node.x + ' ' + node.y + ')'" [attr.data-tone]="node.tone">
          <circle class="node-halo" [attr.r]="node.radius + 8" />
          <circle class="node-body" [attr.r]="node.radius" />
          <text class="node-count" y="-3" text-anchor="middle">{{ node.count }}</text>
          <text class="node-label" y="16" text-anchor="middle">{{ node.label }}</text>
        </g>
      }
    </g>
  </svg>

  <footer class="topology-summary">
    <span>Live operational categories</span>
    <strong>{{ totalExposure() | currency:'USD':'symbol':'1.0-0' }} exposure</strong>
  </footer>

  <ul class="sr-only">
    @for (node of nodes(); track node.id) {
      <li>{{ node.label }}: {{ node.count }} claims, {{ node.exposure | currency:'USD':'symbol':'1.0-0' }} exposure.</li>
    }
  </ul>
</div>
""",
    )

    write(
        SRC / "risk-topology.component.css",
        """@reference "./styles.css";

:host {
  @apply block min-h-72;
}

.topology-shell {
  @apply relative flex min-h-72 flex-col overflow-hidden rounded-panel border border-white/5 bg-obsidian/35;
}

.topology-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 45%, rgb(25 217 255 / 0.08), transparent 34%),
    linear-gradient(180deg, rgb(255 255 255 / 0.025), transparent 38%);
}

.topology-svg {
  @apply relative z-10 h-auto min-h-64 w-full flex-1;
}

.topology-grid circle,
.topology-grid path {
  fill: none;
  stroke: rgb(135 150 177 / 0.13);
  stroke-width: 1;
}

.topology-grid circle {
  stroke-dasharray: 3 9;
}

.topology-connections path {
  --tone: var(--color-cyan);
  fill: none;
  stroke: color-mix(in srgb, var(--tone) 54%, transparent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 8 11;
  animation: topology-flow 8s linear infinite;
}

.topology-connections path[data-tone='violet'],
.topology-node[data-tone='violet'] { --tone: var(--color-violet); }
.topology-connections path[data-tone='amber'],
.topology-node[data-tone='amber'] { --tone: var(--color-warning); }
.topology-connections path[data-tone='green'],
.topology-node[data-tone='green'] { --tone: var(--color-signal); }
.topology-connections path[data-tone='coral'],
.topology-node[data-tone='coral'] { --tone: var(--color-risk); }
.topology-connections path[data-tone='blue'],
.topology-node[data-tone='blue'] { --tone: var(--color-cobalt); }

.core-halo {
  fill: rgb(25 217 255 / 0.07);
  stroke: rgb(25 217 255 / 0.18);
  stroke-width: 1;
  animation: topology-breathe 3.6s ease-in-out infinite;
}

.core-body {
  stroke: rgb(25 217 255 / 0.7);
  stroke-width: 1.5;
}

.core-count,
.node-count {
  fill: #f5f7ff;
  font-family: Inter, sans-serif;
  font-weight: 700;
}

.core-count { font-size: 25px; }
.core-label {
  fill: rgb(135 150 177 / 0.9);
  font-family: Inter, sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.topology-node {
  --tone: var(--color-cyan);
  transform-box: fill-box;
  transform-origin: center;
  animation: topology-node-float 4.8s ease-in-out infinite;
}

.topology-node:nth-child(2n) { animation-delay: -1.7s; }
.topology-node:nth-child(3n) { animation-delay: -3.1s; }

.node-halo {
  fill: color-mix(in srgb, var(--tone) 8%, transparent);
  stroke: color-mix(in srgb, var(--tone) 16%, transparent);
  stroke-width: 1;
}

.node-body {
  fill: rgb(12 20 34 / 0.92);
  stroke: color-mix(in srgb, var(--tone) 72%, white 4%);
  stroke-width: 1.5;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--tone) 22%, transparent));
}

.node-count { font-size: 16px; }
.node-label {
  fill: rgb(245 247 255 / 0.78);
  font-family: Inter, sans-serif;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.topology-summary {
  @apply relative z-10 flex items-center justify-between gap-4 border-t border-white/5 px-4 py-3 text-xs text-muted;
}

.topology-summary strong {
  @apply font-semibold text-white/85;
}

@keyframes topology-flow {
  to { stroke-dashoffset: -38; }
}

@keyframes topology-breathe {
  50% { opacity: 0.56; transform: scale(1.08); transform-origin: 320px 180px; }
}

@keyframes topology-node-float {
  50% { translate: 0 -2px; }
}

@media (max-width: 640px) {
  .node-label { font-size: 7.5px; }
  .topology-summary { @apply items-start; }
}

@media (prefers-reduced-motion: reduce) {
  .topology-connections path,
  .core-halo,
  .topology-node {
    animation: none;
  }
}
""",
    )


def write_structure_layer() -> None:
    write(
        SRC / "tailwind-structure.css",
        """@reference "./styles.css";

:host {
  @apply block min-h-screen font-sans text-white;
}

.workspace {
  @apply px-4 pb-16 pt-5 sm:px-6 2xl:px-8 3xl:px-10;
}

.workspace-header {
  @apply rounded-panel border border-white/5 bg-ink/30 p-4 shadow-panel backdrop-blur-md sm:p-5;
}

.header-copy h1 {
  @apply font-display text-3xl leading-none tracking-[-0.025em] text-white sm:text-4xl;
}

.header-copy p {
  @apply max-w-3xl text-sm leading-6 text-muted;
}

.header-actions,
.scenario-actions {
  @apply gap-2.5;
}

.glass-panel {
  @apply rounded-panel border border-white/10 bg-ink/75 shadow-observatory backdrop-blur-xl;
}

.panel-header {
  @apply gap-3;
}

.panel-kicker,
.eyebrow {
  @apply text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan/75;
}

.panel-subtitle {
  @apply text-xs text-muted;
}

.signal-strip {
  @apply gap-4;
}

.metric-signal {
  @apply rounded-panel border border-white/10 bg-ink/65 p-4 shadow-panel backdrop-blur-lg transition duration-200 ease-out;
}

.metric-signal:hover {
  translate: 0 -2px;
  border-color: rgb(25 217 255 / 0.22);
}

.metric-copy > span {
  @apply text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted;
}

.metric-copy strong {
  @apply tabular-nums tracking-[-0.04em] text-white;
}

.metric-copy small {
  @apply leading-5 text-muted;
}

:where(.refresh-control, .scenario-primary, .scenario-secondary, .text-action, .segmented-control button) {
  @apply rounded-control border border-white/10 transition duration-150 ease-out;
}

:where(.refresh-control, .scenario-primary, .scenario-secondary, .text-action, .segmented-control button):focus-visible {
  @apply outline-none ring-2 ring-cyan/70 ring-offset-2 ring-offset-obsidian;
}

:where(.refresh-control, .scenario-secondary, .segmented-control button):hover:not(:disabled) {
  @apply border-cyan/25 bg-white/5;
}

.scenario-primary {
  @apply border-cyan/35 bg-cyan/10 shadow-[0_0_24px_rgb(25_217_255_/_0.1)];
}

:where(.live-pill, .demo-pill, .status-chip) {
  @apply rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs font-medium;
}

.schedule-row,
.activity-row {
  @apply rounded-xl transition duration-150 ease-out;
}

.schedule-row:hover,
.activity-row:hover {
  @apply bg-white/[0.035];
}

.mode-notice {
  @apply rounded-control border border-warning/20 bg-warning/[0.06] shadow-panel;
}

@media (prefers-reduced-motion: reduce) {
  .metric-signal,
  :where(.refresh-control, .scenario-primary, .scenario-secondary, .text-action, .segmented-control button),
  .schedule-row,
  .activity-row {
    transition-duration: 1ms;
  }

  .metric-signal:hover {
    translate: none;
  }
}
""",
    )


def patch_app_component() -> None:
    ts_path = SRC / "app.component.ts"
    replace_once(
        ts_path,
        "import { MetricValueMotionDirective } from './metric-value-motion.directive';\n",
        "import { MetricValueMotionDirective } from './metric-value-motion.directive';\nimport { RiskTopologyComponent } from './risk-topology.component';\n",
    )
    replace_once(
        ts_path,
        "  imports: [CurrencyPipe, DatePipe, DecimalPipe, MetricValueMotionDirective],",
        "  imports: [CurrencyPipe, DatePipe, DecimalPipe, MetricValueMotionDirective, RiskTopologyComponent],",
    )
    replace_once(
        ts_path,
        "  styleUrls: ['./app.component.css', './app.component.workspaces.css', './portfolio-showcase.css'],",
        "  styleUrls: ['./app.component.css', './app.component.workspaces.css', './portfolio-showcase.css', './tailwind-structure.css'],",
    )

    html_path = SRC / "app.component.html"
    html = html_path.read_text(encoding="utf-8")
    if "<app-risk-topology" not in html:
        pattern = re.compile(r'              <div class="risk-radar">.*?</div>\n', re.DOTALL)
        replacement = "              <app-risk-topology [slices]=\"riskDistribution()\" [totalAtRisk]=\"dashboard().metrics.claimsAtRisk\"></app-risk-topology>\n"
        html, count = pattern.subn(replacement, html, count=1)
        if count != 1:
            raise RuntimeError(f"Expected one overview risk radar, replaced {count}")
        html_path.write_text(html, encoding="utf-8")


def patch_readme() -> None:
    path = ROOT / "README.md"
    replace_once(
        path,
        "| Visual system | CSS gradients, backdrop filters, SVG, WebGL2 atmosphere, responsive grid |",
        "| Visual system | Tailwind CSS v4 structure and tokens, custom CSS, inline SVG, WebGL2 atmosphere |",
    )
    replace_once(
        path,
        "The browser implementation is the final source of truth for materials, lighting, motion, responsiveness, and accessibility. Figma remains the editable layout and interaction blueprint.",
        "The browser implementation is the final source of truth for materials, lighting, motion, responsiveness, and accessibility. Tailwind provides structural tokens and reusable layout rules, while custom CSS, inline SVG, and WebGL preserve the Clinical Observatory effects. Figma remains the editable layout and interaction blueprint.",
    )


def remove_bootstrap_files() -> None:
    if WORKFLOW.exists():
        WORKFLOW.unlink()
    if SCRIPT.exists():
        SCRIPT.unlink()


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"tests", "implementation"}:
        raise SystemExit("Usage: apply-tailwind-hybrid.py tests|implementation")

    mode = sys.argv[1]
    configure_packages()
    configure_global_theme()
    write_tests()

    if mode == "tests":
        return

    write_model()
    write_component()
    write_structure_layer()
    patch_app_component()
    patch_readme()
    remove_bootstrap_files()


if __name__ == "__main__":
    main()
