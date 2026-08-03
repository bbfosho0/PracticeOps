import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createDemoDashboard } from '../../dashboard-model';
import { buildAuditTelemetry, buildDocumentationTelemetry } from '../../operational-telemetry';
import { AuditWorkspaceComponent } from './audit-workspace.component';

describe('AuditWorkspaceComponent', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));

  beforeEach(() => TestBed.configureTestingModule({
    imports: [AuditWorkspaceComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function render(apiMode: 'live' | 'demo') {
    const fixture = TestBed.createComponent(AuditWorkspaceComponent);
    fixture.componentRef.setInput('auditEvents', dashboard.audit.slice(0, 12));
    fixture.componentRef.setInput('telemetry', buildAuditTelemetry(dashboard));
    fixture.componentRef.setInput('documentationTelemetry', buildDocumentationTelemetry(dashboard));
    fixture.componentRef.setInput('outbox', dashboard.outbox);
    fixture.componentRef.setInput('outboxState', { label: 'Published', tone: 'green' });
    fixture.componentRef.setInput('apiMode', apiMode);
    fixture.componentRef.setInput('updatedLabel', 'Updated just now');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders populated audit telemetry through focused spectrum and timeline children', () => {
    const host = render('live');

    expect(host.querySelector('article[appAuditSpectrum]')).not.toBeNull();
    expect(host.querySelector('article[appAuditTimeline]')).not.toBeNull();
    expect(host.querySelectorAll('.spectrum-bar').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('.audit-table .table-row:not(.table-head)').length).toBe(dashboard.audit.length);
    expect(host.querySelector('.audit-table')?.textContent).toContain('Persisted');
  });

  it('labels synthetic audit records as preview data without fabricating persistence', () => {
    const host = render('demo');
    const text = host.textContent ?? '';

    expect(text).toContain('Synthetic preview snapshot');
    expect(text).toContain('Preview transitions');
    expect(text).toContain('Preview delivery state');
    expect(text).toContain('Preview activity stream');
    expect(host.querySelector('.spectrum-panel')?.textContent).toContain('Synthetic preview');
    expect(host.querySelector('.activity-table-panel')?.textContent).toContain('Preview records');
    expect(host.querySelector('.audit-table')?.textContent).toContain('Synthetic fixture');
    for (const fabricatedClaim of [
      'Current persisted snapshot',
      'Persisted transitions',
      'Broker-confirmed messages',
      'Authoritative',
      'Immutable activity stream',
      'PostgreSQL records'
    ]) {
      expect(text).not.toContain(fabricatedClaim);
    }
  });
});
