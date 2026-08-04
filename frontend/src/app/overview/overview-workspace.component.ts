import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  Appointment,
  AuditEvent,
  MetricSignal,
  PipelineStage,
  RiskSlice,
  SignalTone,
  ViewId,
  humanizeStatus,
  initials,
  toneForStatus
} from '../../dashboard-model';
import { AutoAnimateDirective } from '../../auto-animate.directive';
import { ApiMode } from '../../runtime-model';
import { AuditTelemetry, DocumentationTelemetry } from '../../operational-telemetry';
import { RiskTopologyComponent } from '../claims/risk-topology.component';
import { MetricSignalStripComponent } from './metric-signal-strip.component';

@Component({
  selector: 'div[appOverviewWorkspace]',
  standalone: true,
  imports: [AutoAnimateDirective, DatePipe, MetricSignalStripComponent, RiskTopologyComponent],
  templateUrl: './overview-workspace.component.html',
  styleUrl: './overview-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'overview-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class OverviewWorkspaceComponent {
  readonly metrics = input.required<readonly MetricSignal[]>();
  readonly pipeline = input.required<readonly PipelineStage[]>();
  readonly riskDistribution = input.required<readonly RiskSlice[]>();
  readonly documentationTelemetry = input.required<DocumentationTelemetry>();
  readonly auditTelemetry = input.required<AuditTelemetry>();
  readonly appointments = input.required<readonly Appointment[]>();
  readonly auditEvents = input.required<readonly AuditEvent[]>();
  readonly claimsAtRisk = input.required<number>();
  readonly scenarioAppointmentId = input.required<string>();
  readonly apiMode = input.required<ApiMode>();
  readonly kpiAnnouncement = input.required<string>();
  readonly navigationRequested = output<ViewId>();

  statusLabel(value: string): string {
    return humanizeStatus(value);
  }

  tone(value: string): SignalTone {
    return toneForStatus(value);
  }

  initials(value: string): string {
    return initials(value);
  }

  eventTone(event: AuditEvent, index: number): SignalTone {
    const normalized = `${event.action} ${event.summary}`.toLowerCase();
    if (normalized.includes('flag') || normalized.includes('error') || normalized.includes('denied')) return 'coral';
    if (normalized.includes('claim')) return 'amber';
    if (normalized.includes('note') || normalized.includes('documentation')) return 'violet';
    if (normalized.includes('appoint')) return 'cyan';
    return index % 2 === 0 ? 'green' : 'blue';
  }
}
