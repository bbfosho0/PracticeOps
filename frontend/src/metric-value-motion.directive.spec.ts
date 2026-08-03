import { ElementRef } from '@angular/core';
import { MetricValueMotionDirective } from './metric-value-motion.directive';

describe('MetricValueMotionDirective', () => {
  let element: HTMLElement;
  let directive: MetricValueMotionDirective;

  beforeEach(() => {
    element = document.createElement('strong');
    directive = new MetricValueMotionDirective(new ElementRef(element));
  });

  afterEach(() => directive.ngOnDestroy());

  it('renders the initial KPI value without a count-up animation', () => {
    directive.value = 24;
    directive.metricSuffix = '%';
    directive.ngOnChanges({ value: {} as never, metricSuffix: {} as never });

    expect(element.textContent).toBe('24%');
    expect(element.classList.contains('is-updating')).toBeFalse();
  });

  it('honors reduced motion when the KPI value changes', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    directive.value = 24;
    directive.ngOnChanges({ value: {} as never });
    directive.value = 31;
    directive.ngOnChanges({ value: {} as never });

    expect(element.textContent).toBe('31');
    expect(element.classList.contains('is-updating')).toBeFalse();
  });
});
