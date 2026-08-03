import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildMetricSignals, createDemoDashboard } from '../../dashboard-model';
import { MetricSignalStripComponent } from './metric-signal-strip.component';

describe('MetricSignalStripComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('renders every populated metric as an operational signal', () => {
    const metrics = buildMetricSignals(createDemoDashboard(new Date('2026-08-03T15:00:00.000Z')));
    const fixture = TestBed.createComponent(MetricSignalStripComponent);
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('signal-strip');
    expect(host.getAttribute('aria-label')).toBe('Primary operations metrics');
    expect(host.querySelectorAll('.metric-signal').length).toBe(metrics.length);
    expect(host.textContent).toContain('Appointments today');
  });

  it('keeps the metric surface available when the metric collection is empty', () => {
    const fixture = TestBed.createComponent(MetricSignalStripComponent);
    fixture.componentRef.setInput('metrics', []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('signal-strip');
    expect(host.querySelectorAll('.metric-signal').length).toBe(0);
  });

  it('retains the signal-strip geometry in component-scoped CSS', () => {
    const fixture = TestBed.createComponent(MetricSignalStripComponent);
    fixture.componentRef.setInput('metrics', []);
    fixture.detectChanges();

    expect(componentStyleRule('.signal-strip')?.minHeight).toBe('114px');
    expect(componentStyleRule('.metric-signal')?.display).toBe('flex');
  });
});

function componentStyleRule(selector: string): CSSStyleDeclaration | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(selector) && rule.selectorText.includes('_ng')) return rule.style;
    }
  }
  return undefined;
}
