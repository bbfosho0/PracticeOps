import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScheduleFiltersComponent, ScheduleMode } from './schedule-filters.component';

describe('ScheduleFiltersComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(mode: ScheduleMode = 'day') {
    const fixture = TestBed.createComponent(ScheduleFiltersComponent);
    fixture.componentRef.setInput('selectedDate', new Date('2026-08-03T15:00:00.000Z'));
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('statusOptions', ['Confirmed', 'Scheduled']);
    fixture.componentRef.setInput('providerOptions', ['Dr. A', 'Dr. B']);
    fixture.componentRef.setInput('serviceOptions', ['Assessment', 'Therapy']);
    fixture.componentRef.setInput('selectedStatus', 'all');
    fixture.componentRef.setInput('selectedProvider', 'all');
    fixture.componentRef.setInput('selectedService', 'all');
    fixture.detectChanges();
    return fixture;
  }

  it('emits date, mode, and filter changes from accessible controls', () => {
    const fixture = render();
    const modes: ScheduleMode[] = [];
    const dateShifts: number[] = [];
    const providers: string[] = [];
    fixture.componentInstance.modeChanged.subscribe(mode => modes.push(mode));
    fixture.componentInstance.dateShifted.subscribe(days => dateShifts.push(days));
    fixture.componentInstance.providerChanged.subscribe(provider => providers.push(provider));
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('button[aria-label="Previous day"]') as HTMLButtonElement).click();
    (Array.from(host.querySelectorAll('.segmented-control button')).find(button => button.textContent?.trim() === 'Week') as HTMLButtonElement).click();
    const provider = host.querySelector('select[aria-label="Filter by provider"]') as HTMLSelectElement;
    provider.value = 'Dr. B';
    provider.dispatchEvent(new Event('change'));

    expect(dateShifts).toEqual([-1]);
    expect(modes).toEqual(['week']);
    expect(providers).toEqual(['Dr. B']);
  });

  it('emits status changes from the status filter', () => {
    const fixture = render();
    const statuses: string[] = [];
    fixture.componentInstance.statusChanged.subscribe(status => statuses.push(status));
    const status = (fixture.nativeElement as HTMLElement).querySelector(
      'select[aria-label="Filter by status"]'
    ) as HTMLSelectElement;

    status.value = 'Confirmed';
    status.dispatchEvent(new Event('change'));

    expect(statuses).toEqual(['Confirmed']);
  });

  it('emits service changes from the visit-type filter', () => {
    const fixture = render();
    const services: string[] = [];
    fixture.componentInstance.serviceChanged.subscribe(service => services.push(service));
    const service = (fixture.nativeElement as HTMLElement).querySelector(
      'select[aria-label="Filter by visit type"]'
    ) as HTMLSelectElement;

    service.value = 'Therapy';
    service.dispatchEvent(new Event('change'));

    expect(services).toEqual(['Therapy']);
  });

  it('exposes the selected list mode through pressed state', () => {
    const fixture = render('list');
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.segmented-control button'));
    const list = buttons.find(button => button.textContent?.trim() === 'List');

    expect(list?.getAttribute('aria-pressed')).toBe('true');
    expect(list?.classList).toContain('active');
  });

  it('retains the three-column schedule toolbar geometry in component-scoped CSS', () => {
    render();
    const rule = hostStyleRule();

    expect(rule?.minHeight).toBe('48px');
    expect(rule?.gridTemplateColumns).toBe('auto auto 1fr');
  });
});

function hostStyleRule(): CSSStyleDeclaration | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('_nghost') && rule.style.minHeight === '48px') return rule.style;
    }
  }
  return undefined;
}
