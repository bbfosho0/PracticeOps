import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Appointment } from '../../dashboard-model';
import { ClinicianLoadMetric } from '../../operational-telemetry';
import { RunwayBlock, TemporalRunwayComponent } from './temporal-runway.component';

describe('TemporalRunwayComponent', () => {
  const appointments: Appointment[] = [{
    id: 'appointment-1',
    patientDisplayName: 'Fictional Patient',
    clinician: 'Dr. A',
    service: 'Assessment',
    startsAt: '2026-08-03T09:00:00.000Z',
    status: 'Confirmed'
  }];
  const clinicianLoad: ClinicianLoadMetric[] = [{ name: 'Dr. A', appointments: 1, capacity: 7, utilization: 14 }];
  const runwayBlocks: RunwayBlock[] = [{
    id: 'appointment-1',
    patient: 'Fictional Patient',
    clinician: 'Dr. A',
    service: 'Assessment',
    status: 'Confirmed',
    time: '9:00 AM',
    row: 1,
    column: '2 / span 2',
    tone: 'cyan'
  }];

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(source: readonly Appointment[], blocks: readonly RunwayBlock[]) {
    const fixture = TestBed.createComponent(TemporalRunwayComponent);
    fixture.componentRef.setInput('appointments', source);
    fixture.componentRef.setInput('clinicianLoad', source.length ? clinicianLoad : []);
    fixture.componentRef.setInput('runwayBlocks', blocks);
    fixture.componentRef.setInput('scenarioAppointmentId', 'appointment-1');
    fixture.detectChanges();
    return fixture;
  }

  it('renders populated provider rows and accessible appointment blocks', () => {
    const fixture = render(appointments, runwayBlocks);
    const host = fixture.nativeElement as HTMLElement;
    const block = host.querySelector('.appointment-block') as HTMLElement;
    const runway = host.querySelector('.runway-body') as HTMLElement;

    expect(host.querySelectorAll('.provider-row').length).toBe(1);
    expect(block.getAttribute('aria-label')).toBe('Fictional Patient, 9:00 AM, Confirmed');
    expect(block.classList).toContain('scenario-record');
    expect(runway.tabIndex).toBe(0);
    expect(runway.getAttribute('aria-label')).toBe('Schedule timeline');
  });

  it('renders the truthful empty runway state when no appointments match', () => {
    const fixture = render([], []);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.runway-body')).toBeNull();
    expect(host.querySelector('.workspace-empty')?.textContent).toContain('No appointments match this date and filter set.');
  });

  it('retains the runway height and grid geometry in component-scoped CSS', () => {
    render(appointments, runwayBlocks);

    expect(componentStyleRule('.runway-body')?.display).toBe('grid');
    expect(hostStyleRule()?.minHeight).toBe('640px');
  });

  it('owns current-time and appointment polish in component-scoped CSS', () => {
    render(appointments, runwayBlocks);

    expect(componentStyleRule('.current-time-beam')?.width).toBe('2px');
    expect(componentStyleRule('.current-time-label')?.borderTopWidth).toBe('1px');
    expect(componentStyleRule('.appointment-block', style => style.boxShadow !== '')?.boxShadow).not.toBe('');
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

function hostStyleRule(): CSSStyleDeclaration | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('_nghost') && rule.style.minHeight === '640px') return rule.style;
    }
  }
  return undefined;
}
