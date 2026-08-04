import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ViewId } from '../../dashboard-model';
import { ApiMode } from '../../runtime-model';

export interface WorkspaceNavItem {
  readonly id: ViewId;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
}

@Component({
  selector: 'aside[appCommandDock]',
  standalone: true,
  templateUrl: './command-dock.component.html',
  styleUrl: './command-dock.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'command-dock',
    'aria-label': 'PracticeOps navigation'
  }
})
export class CommandDockComponent {
  readonly items = input.required<readonly WorkspaceNavItem[]>();
  readonly activeView = input.required<ViewId>();
  readonly runtimeMode = input.required<ApiMode>();
  readonly stale = input(false);
  readonly viewSelected = output<ViewId>();

  readonly runtimeLabel = computed(() => {
    if (this.stale()) return 'Stale snapshot';
    switch (this.runtimeMode()) {
      case 'live': return 'Live API';
      case 'demo': return 'Synthetic preview';
      case 'connecting': return 'Connecting';
    }
  });

  selectHome(event: Event): void {
    event.preventDefault();
    this.viewSelected.emit('overview');
  }
}
