import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Appointment, humanizeStatus } from '../../dashboard-model';
import { ClinicianLoadMetric } from '../../operational-telemetry';
import { RunwayBlock } from '../../runway-blocks';
export type { RunwayBlock } from '../../runway-blocks';

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
