import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ViewId } from '../../dashboard-model';
import { ObservatoryViewMotionDirective } from '../../observatory-view-motion.directive';
import { ApiMode } from '../../runtime-model';
import { CommandDockComponent, WorkspaceNavItem } from './command-dock.component';
import { RuntimeNoticeComponent } from './runtime-notice.component';
import { RuntimeStatus, WorkspaceHeaderComponent, WorkspaceViewMetadata } from './workspace-header.component';

@Component({
  selector: 'div[appObservatoryShell]',
  standalone: true,
  imports: [CommandDockComponent, ObservatoryViewMotionDirective, RuntimeNoticeComponent, WorkspaceHeaderComponent],
  templateUrl: './observatory-shell.component.html',
  styleUrl: './observatory-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {}
})
export class ObservatoryShellComponent {
  readonly items = input.required<readonly WorkspaceNavItem[]>();
  readonly activeView = input.required<ViewId>();
  readonly runtimeMode = input.required<ApiMode>();
  readonly metadata = input.required<WorkspaceViewMetadata>();
  readonly runtimeStatus = input.required<RuntimeStatus>();
  readonly updatedLabel = input.required<string>();
  readonly refreshing = input.required<boolean>();
  readonly notice = input.required<string>();
  readonly stale = input.required<boolean>();
  readonly retryAvailable = input.required<boolean>();
  readonly viewSelected = output<ViewId>();
  readonly retryRequested = output<void>();
}
