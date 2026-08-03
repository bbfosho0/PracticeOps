import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Appointment, SignalTone, humanizeStatus } from '../../dashboard-model';
import { ClinicianLoadMetric } from '../../operational-telemetry';

export interface RunwayBlock {
  readonly id: string;
  readonly patient: string;
  readonly clinician: string;
  readonly service: string;
  readonly status: string;
  readonly time: string;
  readonly row: number;
  readonly column: string;
  readonly tone: SignalTone;
}

@Component({
  selector: 'article[appTemporalRunway]',
  standalone: true,
  templateUrl: './temporal-runway.component.html',
  styleUrl: './temporal-runway.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'glass-panel runway-panel' }
})
export class TemporalRunwayComponent {
  readonly appointments = input.required<readonly Appointment[]>();
  readonly clinicianLoad = input.required<readonly ClinicianLoadMetric[]>();
  readonly runwayBlocks = input.required<readonly RunwayBlock[]>();
  readonly scenarioAppointmentId = input.required<string>();

  statusLabel(value: string): string {
    return humanizeStatus(value);
  }
}
