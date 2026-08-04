import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Dashboard,
  ViewId,
  buildMetricSignals,
  buildPipelineStages,
  buildRiskDistribution,
  createDemoDashboard
} from '../../dashboard-model';
import { buildAuditTelemetry, buildDocumentationTelemetry } from '../../operational-telemetry';
import { OverviewWorkspaceComponent } from './overview-workspace.component';

describe('OverviewWorkspaceComponent', () => {
  const referenceDate = new Date('2026-08-03T15:00:00.000Z');
  const dashboard = createDemoDashboard(referenceDate);

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(source: Dashboard = dashboard) {
    const fixture = TestBed.createComponent(OverviewWorkspaceComponent);
    fixture.componentRef.setInput('metrics', buildMetricSignals(source));
    fixture.componentRef.setInput('pipeline', buildPipelineStages(source));
    fixture.componentRef.setInput('riskDistribution', buildRiskDistribution(source));
    fixture.componentRef.setInput('documentationTelemetry', buildDocumentationTelemetry(source, referenceDate));
    fixture.componentRef.setInput('auditTelemetry', buildAuditTelemetry(source));
    fixture.componentRef.setInput('appointments', source.appointments.slice(0, 7));
    fixture.componentRef.setInput('auditEvents', source.audit.slice(0, 5));
    fixture.componentRef.setInput('claimsAtRisk', source.metrics.claimsAtRisk);
    fixture.componentRef.setInput('scenarioAppointmentId', source.scenario.appointmentId);
    fixture.componentRef.setInput('apiMode', 'live');
    fixture.componentRef.setInput('kpiAnnouncement', 'Operational metrics refreshed.');
    fixture.detectChanges();
    return fixture;
  }

  it('renders populated schedule and persisted-activity previews and emits navigation', () => {
    const fixture = render();
    const selected: ViewId[] = [];
    fixture.componentInstance.navigationRequested.subscribe(view => selected.push(view));
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('data-workspace-motion-root')).not.toBeNull();
    expect(host.querySelectorAll('.schedule-preview .schedule-row').length).toBe(7);
    expect(host.querySelectorAll('.activity-preview .activity-row').length).toBe(5);
    (host.querySelector('.schedule-preview .text-action') as HTMLButtonElement).click();

    expect(selected).toEqual(['schedule']);
  });

  it('renders stable empty preview surfaces without fabricated records', () => {
    const emptyDashboard: Dashboard = {
      ...dashboard,
      appointments: [],
      audit: [],
      metrics: { ...dashboard.metrics, appointmentsToday: 0 }
    };
    const fixture = render(emptyDashboard);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.signal-strip')).not.toBeNull();
    expect(host.querySelector('.overview-grid')).not.toBeNull();
    expect(host.querySelectorAll('.schedule-row').length).toBe(0);
    expect(host.querySelectorAll('.activity-row').length).toBe(0);
  });

  it('retains the overview workspace grid in component-scoped CSS', () => {
    render();
    const rule = componentStyleRule('.overview-grid');

    expect(rule?.display).toBe('grid');
    expect(rule?.gap).toBe('16px');
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
