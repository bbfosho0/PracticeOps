import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, ViewChild, computed, input } from '@angular/core';
import { gsap } from 'gsap';
import { RiskSlice } from '../../dashboard-model';
import { resolveMotionProfile } from '../../motion-policy';
import { buildRiskTopologyNodes } from '../../risk-topology';

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
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: profile.topologyDuration * 0.82,
        stagger: profile.stagger,
        ease: 'power2.out',
        clearProps: 'opacity,visibility'
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
