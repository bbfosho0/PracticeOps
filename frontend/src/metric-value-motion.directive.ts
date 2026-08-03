import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
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
