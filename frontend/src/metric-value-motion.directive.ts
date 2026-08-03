import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

/**
 * Keeps KPI updates legible by interpolating only genuine value changes.
 * Decorative motion remains in CSS, while this directive owns the text value.
 */
@Directive({
  selector: '[appMetricValueMotion]',
  standalone: true
})
export class MetricValueMotionDirective implements OnChanges, OnDestroy {
  @Input('appMetricValueMotion') value = 0;
  @Input() metricSuffix = '';

  private frameId?: number;
  private clearUpdateId?: number;
  private renderedValue?: number;

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value'] && !changes['metricSuffix']) return;

    const nextValue = this.value;
    if (this.renderedValue === undefined || this.prefersReducedMotion()) {
      this.cancelAnimation();
      this.render(nextValue);
      return;
    }

    if (nextValue === this.renderedValue) {
      this.render(nextValue);
      return;
    }

    this.animate(this.renderedValue, nextValue);
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  private animate(from: number, to: number): void {
    this.cancelAnimation();
    const startedAt = performance.now();
    const duration = Math.min(720, Math.max(360, Math.abs(to - from) * 18));
    this.element.nativeElement.classList.add('is-updating');

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.render(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        this.frameId = requestAnimationFrame(tick);
        return;
      }
      this.element.nativeElement.classList.remove('is-updating');
      this.clearUpdateId = window.setTimeout(() => this.element.nativeElement.classList.remove('is-updating'), 160);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private render(value: number): void {
    this.renderedValue = value;
    this.element.nativeElement.textContent = `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}${this.metricSuffix}`;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private cancelAnimation(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    if (this.clearUpdateId !== undefined) window.clearTimeout(this.clearUpdateId);
    this.frameId = undefined;
    this.clearUpdateId = undefined;
    this.element.nativeElement.classList.remove('is-updating');
  }
}
