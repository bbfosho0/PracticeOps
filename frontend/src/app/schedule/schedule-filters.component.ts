import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { humanizeStatus } from '../../dashboard-model';

export type ScheduleMode = 'day' | 'week' | 'list';

@Component({
  selector: 'section[appScheduleFilters]',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './schedule-filters.component.html',
  styleUrl: './schedule-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'schedule-toolbar glass-panel' }
})
export class ScheduleFiltersComponent {
  readonly selectedDate = input.required<Date>();
  readonly mode = input.required<ScheduleMode>();
  readonly statusOptions = input.required<readonly string[]>();
  readonly providerOptions = input.required<readonly string[]>();
  readonly serviceOptions = input.required<readonly string[]>();
  readonly selectedStatus = input.required<string>();
  readonly selectedProvider = input.required<string>();
  readonly selectedService = input.required<string>();
  readonly dateShifted = output<number>();
  readonly modeChanged = output<ScheduleMode>();
  readonly statusChanged = output<string>();
  readonly providerChanged = output<string>();
  readonly serviceChanged = output<string>();

  statusLabel(value: string): string {
    return humanizeStatus(value);
  }
}
