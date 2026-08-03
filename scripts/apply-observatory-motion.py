from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
SRC = FRONTEND / "src"
SCRIPT = Path(__file__).resolve()
BOOTSTRAP_WORKFLOW = ROOT / ".github" / "workflows" / "motion-bootstrap.yml"
DIAGNOSTIC_WORKFLOW = ROOT / ".github" / "workflows" / "tailwind-layout-diagnostic.yml"
DIAGNOSTIC_EVIDENCE = ROOT / "docs" / "diagnostics" / "tailwind-mobile-rail.json"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"Expected replacement marker not found in {path}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def add_dependencies() -> None:
    package_path = FRONTEND / "package.json"
    package = json.loads(package_path.read_text(encoding="utf-8"))
    dependencies = package.setdefault("dependencies", {})
    dependencies["@formkit/auto-animate"] = "0.10.0"
    dependencies["gsap"] = "3.15.0"
    package["dependencies"] = dict(sorted(dependencies.items()))
    write(package_path, json.dumps(package, indent=2))


def write_policy_tests() -> None:
    write(
        SRC / "motion-policy.spec.ts",
        """import { metricMotionDuration, resolveMotionProfile } from './motion-policy';

describe('observatory motion policy', () => {
  it('disables authored motion for reduced-motion users', () => {
    const profile = resolveMotionProfile(true, false);

    expect(profile.enabled).toBeFalse();
    expect(profile.viewDuration).toBe(0);
    expect(profile.stagger).toBe(0);
    expect(profile.metricDuration).toBe(0);
    expect(profile.topologyDuration).toBe(0);
  });

  it('uses a tighter profile on compact viewports', () => {
    const desktop = resolveMotionProfile(false, false);
    const compact = resolveMotionProfile(false, true);

    expect(desktop.enabled).toBeTrue();
    expect(compact.enabled).toBeTrue();
    expect(compact.viewDuration).toBeLessThan(desktop.viewDuration);
    expect(compact.stagger).toBeLessThan(desktop.stagger);
    expect(compact.topologyDuration).toBeLessThan(desktop.topologyDuration);
  });

  it('bounds metric tween duration while reacting to larger changes', () => {
    const profile = resolveMotionProfile(false, false);
    const small = metricMotionDuration(10, 11, profile);
    const large = metricMotionDuration(10, 1000, profile);

    expect(small).toBeGreaterThanOrEqual(profile.metricDuration);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThanOrEqual(profile.metricDuration + 0.32);
  });

  it('returns zero metric duration when motion is disabled', () => {
    const profile = resolveMotionProfile(true, true);

    expect(metricMotionDuration(10, 100, profile)).toBe(0);
  });
});
""",
    )


def write_policy() -> None:
    write(
        SRC / "motion-policy.ts",
        """export interface MotionProfile {
  enabled: boolean;
  viewDuration: number;
  stagger: number;
  metricDuration: number;
  topologyDuration: number;
  travel: number;
}

export function resolveMotionProfile(reducedMotion: boolean, compactViewport: boolean): MotionProfile {
  if (reducedMotion) {
    return {
      enabled: false,
      viewDuration: 0,
      stagger: 0,
      metricDuration: 0,
      topologyDuration: 0,
      travel: 0
    };
  }

  if (compactViewport) {
    return {
      enabled: true,
      viewDuration: 0.26,
      stagger: 0.028,
      metricDuration: 0.38,
      topologyDuration: 0.42,
      travel: 12
    };
  }

  return {
    enabled: true,
    viewDuration: 0.34,
    stagger: 0.045,
    metricDuration: 0.48,
    topologyDuration: 0.58,
    travel: 18
  };
}

export function metricMotionDuration(from: number, to: number, profile: MotionProfile): number {
  if (!profile.enabled) return 0;
  const magnitude = Math.abs(to - from);
  return profile.metricDuration + Math.min(0.32, Math.log10(magnitude + 1) * 0.1);
}
""",
    )


def write_view_motion_directive() -> None:
    write(
        SRC / "observatory-view-motion.directive.ts",
        """import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { gsap } from 'gsap';
import { ViewId } from './dashboard-model';
import { resolveMotionProfile } from './motion-policy';

const PERSISTENT_SURFACES = new Set([
  'workspace-header',
  'mode-notice',
  'scenario-rail',
  'portfolio-proof',
  'sr-only'
]);

@Directive({
  selector: '[appObservatoryViewMotion]',
  standalone: true
})
export class ObservatoryViewMotionDirective implements OnChanges, OnDestroy {
  @Input('appObservatoryViewMotion') view: ViewId = 'overview';

  private timeline?: gsap.core.Timeline;
  private frameId?: number;

  constructor(
    private readonly element: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['view']) return;
    this.scheduleAnimation();
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.timeline?.kill();
    gsap.killTweensOf(this.targets());
  }

  private scheduleAnimation(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.zone.runOutsideAngular(() => {
      this.frameId = requestAnimationFrame(() => {
        this.frameId = undefined;
        this.animateCurrentView();
      });
    });
  }

  private animateCurrentView(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 760px)').matches;
    const profile = resolveMotionProfile(reducedMotion, compactViewport);
    const headerTargets = Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('.header-copy > *'));
    const surfaceTargets = this.currentViewSurfaces();
    const allTargets = [...headerTargets, ...surfaceTargets];

    this.timeline?.kill();
    gsap.killTweensOf(allTargets);

    if (!profile.enabled) {
      gsap.set(allTargets, { clearProps: 'opacity,visibility,transform' });
      return;
    }

    this.timeline = gsap.timeline({ defaults: { overwrite: true } });
    this.timeline.fromTo(
      headerTargets,
      { autoAlpha: 0, y: Math.max(5, profile.travel * 0.42) },
      {
        autoAlpha: 1,
        y: 0,
        duration: profile.viewDuration * 0.72,
        stagger: profile.stagger,
        ease: 'power3.out',
        clearProps: 'opacity,visibility,transform'
      }
    );
    this.timeline.fromTo(
      surfaceTargets,
      { autoAlpha: 0, y: profile.travel, scale: 0.992 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: profile.viewDuration,
        stagger: profile.stagger,
        ease: 'power3.out',
        clearProps: 'opacity,visibility,transform'
      },
      '<0.06'
    );
  }

  private currentViewSurfaces(): HTMLElement[] {
    return Array.from(this.element.nativeElement.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .filter(child => !Array.from(PERSISTENT_SURFACES).some(className => child.classList.contains(className)));
  }

  private targets(): HTMLElement[] {
    return [
      ...Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('.header-copy > *')),
      ...this.currentViewSurfaces()
    ];
  }
}
""",
    )


def write_metric_directive() -> None:
    write(
        SRC / "metric-value-motion.directive.ts",
        """import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { gsap } from 'gsap';
import { metricMotionDuration, resolveMotionProfile } from './motion-policy';

/**
 * Keeps KPI updates legible by interpolating only genuine value changes.
 * GSAP owns the numeric tween while CSS owns the visual update treatment.
 */
@Directive({
  selector: '[appMetricValueMotion]',
  standalone: true
})
export class MetricValueMotionDirective implements OnChanges, OnDestroy {
  @Input('appMetricValueMotion') value = 0;
  @Input() metricSuffix = '';

  private tween?: gsap.core.Tween;
  private clearUpdateId?: number;
  private renderedValue?: number;
  private readonly proxy = { value: 0 };

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value'] && !changes['metricSuffix']) return;

    const nextValue = this.value;
    const profile = resolveMotionProfile(
      this.prefersReducedMotion(),
      typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
    );

    if (this.renderedValue === undefined || !profile.enabled) {
      this.cancelAnimation();
      this.render(nextValue);
      return;
    }

    if (nextValue === this.renderedValue) {
      this.render(nextValue);
      return;
    }

    this.animate(this.renderedValue, nextValue, metricMotionDuration(this.renderedValue, nextValue, profile));
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  private animate(from: number, to: number, duration: number): void {
    this.cancelAnimation();
    this.proxy.value = from;
    this.element.nativeElement.classList.add('is-updating');

    this.tween = gsap.to(this.proxy, {
      value: to,
      duration,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => this.render(Math.round(this.proxy.value)),
      onComplete: () => {
        this.render(to);
        this.element.nativeElement.classList.remove('is-updating');
        this.clearUpdateId = window.setTimeout(
          () => this.element.nativeElement.classList.remove('is-updating'),
          160
        );
      }
    });
  }

  private render(value: number): void {
    this.renderedValue = value;
    this.element.nativeElement.textContent = `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}${this.metricSuffix}`;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private cancelAnimation(): void {
    this.tween?.kill();
    this.tween = undefined;
    if (this.clearUpdateId !== undefined) window.clearTimeout(this.clearUpdateId);
    this.clearUpdateId = undefined;
    this.element.nativeElement.classList.remove('is-updating');
  }
}
""",
    )


def write_risk_component() -> None:
    write(
        SRC / "risk-topology.component.ts",
        """import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, ViewChild, computed, input } from '@angular/core';
import { gsap } from 'gsap';
import { RiskSlice } from './dashboard-model';
import { resolveMotionProfile } from './motion-policy';
import { buildRiskTopologyNodes } from './risk-topology';

@Component({
  selector: 'app-risk-topology',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './risk-topology.component.html',
  styleUrl: './risk-topology.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskTopologyComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly slices = input.required<readonly RiskSlice[]>();
  readonly totalAtRisk = input.required<number>();
  readonly nodes = computed(() => buildRiskTopologyNodes(this.slices()));
  readonly totalExposure = computed(() => this.slices().reduce((total, slice) => total + slice.exposure, 0));

  @ViewChild('topologySvg') private readonly topologySvg?: ElementRef<SVGSVGElement>;

  private viewReady = false;
  private frameId?: number;
  private entranceTimeline?: gsap.core.Timeline;
  private flowTween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.scheduleMotion();
  }

  ngOnChanges(): void {
    if (this.viewReady) this.scheduleMotion();
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.entranceTimeline?.kill();
    this.flowTween?.kill();
  }

  private scheduleMotion(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => {
      this.frameId = undefined;
      this.animateTopology();
    });
  }

  private animateTopology(): void {
    const svg = this.topologySvg?.nativeElement;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('.topology-connections path'));
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>('.topology-node'));
    const core = svg.querySelector<SVGGElement>('.topology-core');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 760px)').matches;
    const profile = resolveMotionProfile(reducedMotion, compactViewport);
    const targets = [...paths, ...nodes, ...(core ? [core] : [])];

    this.entranceTimeline?.kill();
    this.flowTween?.kill();
    gsap.killTweensOf(targets);

    if (!profile.enabled) {
      gsap.set(targets, { clearProps: 'opacity,visibility,transform,strokeDashoffset' });
      return;
    }

    this.entranceTimeline = gsap.timeline({ defaults: { overwrite: true } });
    if (core) {
      this.entranceTimeline.fromTo(
        core,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: profile.topologyDuration * 0.45, ease: 'power2.out' }
      );
    }
    this.entranceTimeline.fromTo(
      paths,
      { autoAlpha: 0, strokeDashoffset: 34 },
      {
        autoAlpha: 1,
        strokeDashoffset: 0,
        duration: profile.topologyDuration,
        stagger: profile.stagger,
        ease: 'power2.out'
      },
      0
    );
    this.entranceTimeline.fromTo(
      nodes,
      { autoAlpha: 0, scale: 0.72, transformOrigin: 'center center' },
      {
        autoAlpha: 1,
        scale: 1,
        duration: profile.topologyDuration * 0.82,
        stagger: profile.stagger,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,visibility,transform'
      },
      0.08
    );
    this.entranceTimeline.eventCallback('onComplete', () => {
      this.flowTween = gsap.to(paths, {
        strokeDashoffset: -38,
        duration: 8,
        repeat: -1,
        ease: 'none',
        overwrite: true
      });
    });
  }
}
""",
    )


def patch_risk_template_and_css() -> None:
    replace_once(
        SRC / "risk-topology.component.html",
        '<svg class="topology-svg" viewBox="0 0 640 360" role="img"',
        '<svg #topologySvg class="topology-svg" viewBox="0 0 640 360" role="img"',
    )

    css_path = SRC / "risk-topology.component.css"
    css = css_path.read_text(encoding="utf-8")
    css = css.replace(
        "  animation: topology-flow 8s linear infinite;",
        "  will-change: opacity, stroke-dashoffset;",
    )
    css = re.sub(
        r"\n@keyframes topology-flow \{\n  to \{ stroke-dashoffset: -38; \}\n\}\n",
        "\n",
        css,
        count=1,
    )
    css_path.write_text(css, encoding="utf-8")


def patch_app_component() -> None:
    ts_path = SRC / "app.component.ts"
    replace_once(
        ts_path,
        "import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';\n",
        "import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';\nimport { AutoAnimateDirective } from '@formkit/auto-animate/angular';\n",
    )
    replace_once(
        ts_path,
        "import { MetricValueMotionDirective } from './metric-value-motion.directive';\n",
        "import { MetricValueMotionDirective } from './metric-value-motion.directive';\nimport { ObservatoryViewMotionDirective } from './observatory-view-motion.directive';\n",
    )
    replace_once(
        ts_path,
        "  imports: [CurrencyPipe, DatePipe, DecimalPipe, MetricValueMotionDirective, RiskTopologyComponent],",
        "  imports: [CurrencyPipe, DatePipe, DecimalPipe, MetricValueMotionDirective, RiskTopologyComponent, AutoAnimateDirective, ObservatoryViewMotionDirective],",
    )

    html_path = SRC / "app.component.html"
    html = html_path.read_text(encoding="utf-8")
    replacements = [
        ('<main class="workspace">', '<main class="workspace" [appObservatoryViewMotion]="activeView()">'),
        ('<div class="scenario-actions">', '<div class="scenario-actions" auto-animate>'),
        ('<div class="activity-list">', '<div class="activity-list" auto-animate>'),
        ('<section class="schedule-workspace"', '<section class="schedule-workspace" auto-animate'),
        ('<div class="data-table claims-table"', '<div class="data-table claims-table" auto-animate'),
    ]
    for old, new in replacements:
        if new in html:
            continue
        if old not in html:
            raise RuntimeError(f"Expected HTML marker not found: {old}")
        html = html.replace(old, new, 1)

    html = html.replace('<div class="schedule-list">', '<div class="schedule-list" auto-animate>')
    html = html.replace('<div class="schedule-list full-list">', '<div class="schedule-list full-list" auto-animate>')
    html_path.write_text(html, encoding="utf-8")


def patch_visual_audit() -> None:
    path = ROOT / ".github" / "workflows" / "visual-audit.yml"
    text = path.read_text(encoding="utf-8")
    marker = "            assert(state.dataView === view.id, `Expected data-view ${view.id}, received ${state.dataView}`);\n          };"
    replacement = "            assert(state.dataView === view.id, `Expected data-view ${view.id}, received ${state.dataView}`);\n            await sleep(700);\n          };"
    if replacement not in text:
        if marker not in text:
            raise RuntimeError("Could not locate visual-audit selectView marker")
        text = text.replace(marker, replacement, 1)
    path.write_text(text, encoding="utf-8")


def patch_readme() -> None:
    path = ROOT / "README.md"
    replace_once(
        path,
        "| Visual system | Tailwind CSS v4 structure and tokens, custom CSS, inline SVG, WebGL2 atmosphere |",
        "| Visual system | Tailwind CSS v4 structure and tokens, AutoAnimate, GSAP, custom CSS, inline SVG, WebGL2 atmosphere |",
    )
    replace_once(
        path,
        "Tailwind provides structural tokens and reusable layout rules, while custom CSS, inline SVG, and WebGL preserve the Clinical Observatory effects.",
        "Tailwind provides structural tokens and reusable layout rules. AutoAnimate handles structural list and layout changes, GSAP handles authored state and SVG choreography, and custom CSS plus WebGL preserve the Clinical Observatory atmosphere.",
    )


def remove_temporary_files() -> None:
    for path in [BOOTSTRAP_WORKFLOW, DIAGNOSTIC_WORKFLOW, DIAGNOSTIC_EVIDENCE, SCRIPT]:
        if path.exists():
            path.unlink()


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"tests", "implementation"}:
        raise SystemExit("Usage: apply-observatory-motion.py tests|implementation")

    add_dependencies()
    write_policy_tests()

    if sys.argv[1] == "tests":
        return

    write_policy()
    write_view_motion_directive()
    write_metric_directive()
    write_risk_component()
    patch_risk_template_and_css()
    patch_app_component()
    patch_visual_audit()
    patch_readme()
    remove_temporary_files()


if __name__ == "__main__":
    main()
