import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Appointment, createDemoDashboard } from '../../dashboard-model';
import { ClinicianLoadMetric, ScheduleTelemetry } from '../../operational-telemetry';
import { RunwayBlock } from './temporal-runway.component';
import {
  ScheduleWorkspaceComponent,
  WeekSummaryDay,
  filterScheduleAppointments
} from './schedule-workspace.component';

describe('ScheduleWorkspaceComponent', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));
  const appointments = dashboard.appointments.slice(0, 3);
  const telemetry: ScheduleTelemetry = {
    appointments: 3,
    confirmed: 1,
    checkedIn: 0,
    inSession: 0,
    completed: 0,
    scheduled: 2,
    noShowRisk: 33,
    capacityPercent: 21,
    availableSlots: 11,
    reminders: { text: 1, email: 1, call: 1, total: 3 }
  };
  const clinicianLoad: ClinicianLoadMetric[] = [{ name: appointments[0].clinician, appointments: 3, capacity: 7, utilization: 43 }];
  const runwayBlocks: RunwayBlock[] = appointments.map((appointment, index) => ({
    id: appointment.id,
    patient: appointment.patientDisplayName,
    clinician: appointment.clinician,
    service: appointment.service,
    status: appointment.status,
    time: `${9 + index}:00 AM`,
    row: 1,
    column: `${index + 2} / span 1`,
    tone: 'cyan', lane: 0, laneCount: 1
  }));
  const weekSummary: WeekSummaryDay[] = Array.from({ length: 7 }, (_, index) => ({
    date: new Date(2026, 7, 3 + index),
    appointments: index,
    utilization: index * 10
  }));

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(mode: 'day' | 'week' | 'list', source: readonly Appointment[] = appointments) {
    const fixture = TestBed.createComponent(ScheduleWorkspaceComponent);
    fixture.componentRef.setInput('appointments', source);
    fixture.componentRef.setInput('selectedDate', new Date(2026, 7, 3));
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('providerOptions', [appointments[0].clinician]);
    fixture.componentRef.setInput('serviceOptions', [appointments[0].service]);
    fixture.componentRef.setInput('statusOptions', [appointments[0].status]);
    fixture.componentRef.setInput('selectedProvider', 'all');
    fixture.componentRef.setInput('selectedService', 'all');
    fixture.componentRef.setInput('selectedStatus', 'all');
    fixture.componentRef.setInput('telemetry', telemetry);
    fixture.componentRef.setInput('clinicianLoad', source.length ? clinicianLoad : []);
    fixture.componentRef.setInput('runwayBlocks', source.length ? runwayBlocks : []);
    fixture.componentRef.setInput('weekSummary', weekSummary);
    fixture.componentRef.setInput('noShowRiskAppointments', source.slice(0, 1));
    fixture.componentRef.setInput('waitlist', [{ patient: 'Fictional Patient', requested: '9:00 AM', opening: '1 confirmation pending' }]);
    fixture.componentRef.setInput('scenarioAppointmentId', source[0]?.id ?? '');
    fixture.detectChanges();
    return fixture;
  }

  it('renders the day runway while preserving the structural AutoAnimate surface', () => {
    const fixture = render('day');
    const host = fixture.nativeElement as HTMLElement;
    const workspace = host.querySelector('.schedule-workspace') as HTMLElement;

    expect(host.getAttribute('data-workspace-motion-root')).not.toBeNull();
    expect(workspace.getAttribute('data-mode')).toBe('day');
    expect(workspace.hasAttribute('auto-animate')).toBeTrue();
    expect(host.querySelector('[appTemporalRunway], .runway-panel')).not.toBeNull();
  });

  it('renders seven-day capacity in week mode', () => {
    const fixture = render('week');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.week-panel')).not.toBeNull();
    expect(host.querySelectorAll('.week-grid > article').length).toBe(7);
    expect(host.querySelector('[appTemporalRunway]')).toBeNull();
  });

  it('renders populated and empty list states in list mode', () => {
    const populated = render('list');
    const empty = render('list', []);
    const populatedList = (populated.nativeElement as HTMLElement).querySelector('.schedule-list') as HTMLElement;

    expect((populated.nativeElement as HTMLElement).querySelectorAll('.full-list .schedule-row').length).toBe(3);
    expect(populatedList.tabIndex).toBe(0);
    expect(populatedList.getAttribute('aria-label')).toBe('Appointment list results');
    expect((empty.nativeElement as HTMLElement).querySelector('.list-panel .workspace-empty')?.textContent).toContain('No appointments match this date and filter set.');
  });

  it('filters appointments by provider, service, and status without private component access', () => {
    const [first, second] = appointments;
    const filtered = filterScheduleAppointments(
      [first, second],
      { provider: second.clinician, service: second.service, status: second.status }
    );

    expect(filtered.map(appointment => appointment.id)).toEqual([second.id]);
  });

  it('forwards child control outputs through the workspace boundary', () => {
    const fixture = render('day');
    const dateShifts: number[] = [];
    const modes: string[] = [];
    const statuses: string[] = [];
    const providers: string[] = [];
    const services: string[] = [];
    fixture.componentInstance.dateShifted.subscribe(value => dateShifts.push(value));
    fixture.componentInstance.modeChanged.subscribe(value => modes.push(value));
    fixture.componentInstance.statusChanged.subscribe(value => statuses.push(value));
    fixture.componentInstance.providerChanged.subscribe(value => providers.push(value));
    fixture.componentInstance.serviceChanged.subscribe(value => services.push(value));
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('button[aria-label="Next day"]') as HTMLButtonElement).click();
    (Array.from(host.querySelectorAll('.segmented-control button')).find(
      button => button.textContent?.trim() === 'List'
    ) as HTMLButtonElement).click();
    changeSelect(host, 'Filter by status', appointments[0].status);
    changeSelect(host, 'Filter by provider', appointments[0].clinician);
    changeSelect(host, 'Filter by visit type', appointments[0].service);

    expect(dateShifts).toEqual([1]);
    expect(modes).toEqual(['list']);
    expect(statuses).toEqual([appointments[0].status]);
    expect(providers).toEqual([appointments[0].clinician]);
    expect(services).toEqual([appointments[0].service]);
  });

  it('retains the workspace and side-telemetry grids in component-scoped CSS', () => {
    render('day');

    expect(componentStyleRule('.schedule-workspace')?.display).toBe('grid');
    expect(componentStyleRule('.schedule-side')?.display).toBe('grid');
  });

  it('owns the runway panel background polish in component-scoped CSS', () => {
    render('week');

    expect(componentStyleRule('.runway-panel', style => style.backgroundImage !== '')?.backgroundImage).toContain('linear-gradient');
  });
});

function componentStyleRule(
  selector: string,
  matches: (style: CSSStyleDeclaration) => boolean = () => true
): CSSStyleDeclaration | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(selector) && rule.selectorText.includes('_ng') && matches(rule.style)) return rule.style;
    }
  }
  return undefined;
}

function changeSelect(host: HTMLElement, label: string, value: string): void {
  const select = host.querySelector(`select[aria-label="${label}"]`) as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change'));
}
