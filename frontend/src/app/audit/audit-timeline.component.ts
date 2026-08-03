import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AuditEvent } from '../../dashboard-model';
import { ApiMode } from '../../operational-refresh.store';

@Component({
  selector: 'article[appAuditTimeline]',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit-timeline.component.html',
  styleUrl: './audit-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditTimelineComponent {
  readonly events = input.required<readonly AuditEvent[]>();
  readonly apiMode = input.required<ApiMode>();
}
