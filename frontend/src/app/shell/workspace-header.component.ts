import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SignalTone } from '../../dashboard-model';

export interface WorkspaceViewMetadata {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly liveLabel: string;
  readonly tone: SignalTone;
}

export interface RuntimeStatus {
  readonly label: string;
  readonly tone: SignalTone;
}

@Component({
  selector: 'header[appWorkspaceHeader]',
  standalone: true,
  templateUrl: './workspace-header.component.html',
  styleUrl: './workspace-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'workspace-header' }
})
export class WorkspaceHeaderComponent {
  readonly metadata = input.required<WorkspaceViewMetadata>();
  readonly runtimeStatus = input.required<RuntimeStatus>();
  readonly updatedLabel = input.required<string>();
  readonly refreshing = input.required<boolean>();
  readonly refreshRequested = output<void>();
}
