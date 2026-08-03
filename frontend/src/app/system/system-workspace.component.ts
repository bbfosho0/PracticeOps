import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Dashboard, SignalTone } from '../../dashboard-model';
import { ApiMode } from '../../operational-refresh.store';

export interface NotificationPreference {
  readonly label: string;
  readonly cadence: string;
  readonly state: boolean;
}

export interface SystemDisplayState {
  readonly label: string;
  readonly tone: SignalTone;
}

@Component({
  selector: 'div[appSystemWorkspace]',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './system-workspace.component.html',
  styleUrl: './system-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'system-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class SystemWorkspaceComponent {
  readonly dashboard = input.required<Readonly<Dashboard>>();
  readonly apiMode = input.required<ApiMode>();
  readonly systemState = input.required<SystemDisplayState>();
  readonly updatedLabel = input.required<string>();
  readonly stale = input.required<boolean>();
  readonly refreshing = input.required<boolean>();
  readonly mutationPending = input.required<boolean>();
  readonly outboxState = input.required<SystemDisplayState>();
  readonly preferences = input.required<readonly NotificationPreference[]>();
  readonly refreshRequested = output<void>();
  readonly preferenceToggled = output<number>();
  readonly resetRequested = output<void>();
  readonly auditRequested = output<void>();

  readonly integrationHealth = computed(() => {
    const live = this.apiMode() === 'live';
    const outbox = this.dashboard().outbox;
    const notificationsEnabled = this.preferences().filter(item => item.state).length;
    return [
      { name: 'PracticeOps API', detail: live ? this.updatedLabel() : 'Static fictional preview', state: this.systemState().label, tone: this.systemState().tone },
      { name: 'PostgreSQL snapshot', detail: live ? 'Dashboard query completed' : 'Unavailable in preview mode', state: live ? 'Reachable' : 'Not connected', tone: live ? 'cyan' as const : 'violet' as const },
      { name: 'Transactional outbox', detail: `${outbox.publishedMessages} published · ${outbox.pendingMessages} pending`, state: this.outboxState().label, tone: this.outboxState().tone },
      { name: 'Local preferences', detail: `${notificationsEnabled}/${this.preferences().length} enabled in this browser`, state: 'Browser-local', tone: notificationsEnabled > 0 ? 'green' as const : 'amber' as const }
    ];
  });
}
