import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AuditEvent, OutboxSummary, SignalTone } from '../../dashboard-model';
import { ApiMode } from '../../operational-refresh.store';
import { AuditTelemetry, DocumentationTelemetry } from '../../operational-telemetry';
import { AuditSpectrumComponent } from './audit-spectrum.component';
import { AuditTimelineComponent } from './audit-timeline.component';

export interface AuditOutboxState {
  readonly label: string;
  readonly tone: SignalTone;
}

@Component({
  selector: 'div[appAuditWorkspace]',
  standalone: true,
  imports: [AuditSpectrumComponent, AuditTimelineComponent, DecimalPipe],
  templateUrl: './audit-workspace.component.html',
  styleUrl: './audit-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'audit-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class AuditWorkspaceComponent {
  readonly auditEvents = input.required<readonly AuditEvent[]>();
  readonly telemetry = input.required<Readonly<AuditTelemetry>>();
  readonly documentationTelemetry = input.required<Readonly<DocumentationTelemetry>>();
  readonly outbox = input.required<Readonly<OutboxSummary>>();
  readonly outboxState = input.required<AuditOutboxState>();
  readonly apiMode = input.required<ApiMode>();
  readonly updatedLabel = input.required<string>();

  readonly eventTypeMetrics = computed(() => this.telemetry().categories.map(category => ({ label: category.label, count: category.count, share: `${category.share.toFixed(1)}%`, tone: category.tone })));
  readonly auditSummary = computed(() => {
    const telemetry = this.telemetry();
    const outbox = this.outbox();
    const categoryCount = (label: string) => telemetry.categories.find(item => item.label === label)?.count ?? 0;
    return [
      { label: 'Audit events', value: `${telemetry.eventsToday}`, detail: 'Current persisted snapshot', tone: 'cyan' as const },
      { label: 'Appointment events', value: `${categoryCount('Appointments')}`, detail: 'Persisted transitions', tone: 'blue' as const },
      { label: 'Documentation events', value: `${categoryCount('Documentation')}`, detail: 'Persisted transitions', tone: 'violet' as const },
      { label: 'Claim events', value: `${categoryCount('Claims')}`, detail: 'Persisted transitions', tone: 'amber' as const },
      { label: 'Outbox published', value: `${outbox.publishedMessages}`, detail: 'Broker-confirmed messages', tone: 'green' as const },
      { label: 'Outbox pending', value: `${outbox.pendingMessages}`, detail: outbox.pendingMessages ? 'Waiting for publication' : 'Queue clear', tone: outbox.pendingMessages ? 'amber' as const : 'green' as const }
    ];
  });
  readonly auditCards = computed(() => {
    const signed = this.documentationTelemetry().signed;
    const claimEvents = this.telemetry().categories.find(item => item.label === 'Claims')?.count ?? 0;
    const outbox = this.outbox();
    return [
      { title: 'Outbox publication', value: `${outbox.publishedMessages}/${outbox.totalMessages}`, detail: this.outboxState().label, tone: this.outboxState().tone },
      { title: 'Pending messages', value: `${outbox.pendingMessages}`, detail: outbox.pendingMessages ? 'Retrying safely' : 'Queue clear', tone: outbox.pendingMessages ? 'amber' as const : 'green' as const },
      { title: 'Note signatures', value: `${signed}`, detail: 'Signed', tone: 'green' as const },
      { title: 'Claim status changes', value: `${claimEvents}`, detail: 'Audited events', tone: 'blue' as const }
    ];
  });
}
