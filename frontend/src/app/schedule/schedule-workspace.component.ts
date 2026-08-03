import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Appointment, SignalTone, humanizeStatus, initials, toneForStatus } from '../../dashboard-model';
import { AutoAnimateDirective } from '../../auto-animate.directive';
import { ClinicianLoadMetric, ScheduleTelemetry } from '../../operational-telemetry';
import { ScheduleFiltersComponent, ScheduleMode } from './schedule-filters.component';
import { RunwayBlock, TemporalRunwayComponent } from './temporal-runway.component';

export interface ScheduleFilterSelection {
  readonly provider: string;
  readonly service: string;
  readonly status: string;
}

export interface WeekSummaryDay {
  readonly date: Date;
  readonly appointments: number;
  readonly utilization: number;
}

export interface WaitlistItem {
  readonly patient: string;
  readonly requested: string;
  readonly opening: string;
}

export function filterScheduleAppointments(
  appointments: readonly Appointment[],
  filters: ScheduleFilterSelection
): Appointment[] {
  return appointments.filter(appointment =>
    (filters.provider === 'all' || appointment.clinician === filters.provider)
    && (filters.service === 'all' || appointment.service === filters.service)
    && (filters.status === 'all' || appointment.status === filters.status));
}

@Component({
  selector: 'div[appScheduleWorkspace]',
  standalone: true,
  imports: [AutoAnimateDirective, DatePipe, ScheduleFiltersComponent, TemporalRunwayComponent],
  templateUrl: './schedule-workspace.component.html',
  styleUrl: './schedule-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'schedule-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class ScheduleWorkspaceComponent {
  readonly appointments = input.required<readonly Appointment[]>();
  readonly selectedDate = input.required<Date>();
  readonly mode = input.required<ScheduleMode>();
  readonly providerOptions = input.required<readonly string[]>();
  readonly serviceOptions = input.required<readonly string[]>();
  readonly statusOptions = input.required<readonly string[]>();
  readonly selectedProvider = input.required<string>();
  readonly selectedService = input.required<string>();
  readonly selectedStatus = input.required<string>();
  readonly telemetry = input.required<ScheduleTelemetry>();
  readonly clinicianLoad = input.required<readonly ClinicianLoadMetric[]>();
  readonly runwayBlocks = input.required<readonly RunwayBlock[]>();
  readonly weekSummary = input.required<readonly WeekSummaryDay[]>();
  readonly noShowRiskAppointments = input.required<readonly Appointment[]>();
  readonly waitlist = input.required<readonly WaitlistItem[]>();
  readonly scenarioAppointmentId = input.required<string>();
  readonly dateShifted = output<number>();
  readonly modeChanged = output<ScheduleMode>();
  readonly statusChanged = output<string>();
  readonly providerChanged = output<string>();
  readonly serviceChanged = output<string>();

  statusLabel(value: string): string {
    return humanizeStatus(value);
  }

  tone(value: string): SignalTone {
    return toneForStatus(value);
  }

  initials(value: string): string {
    return initials(value);
  }
}
