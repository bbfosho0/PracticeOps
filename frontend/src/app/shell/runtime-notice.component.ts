import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ApiMode } from '../../operational-refresh.store';

@Component({
  selector: 'section[appRuntimeNotice]',
  standalone: true,
  templateUrl: './runtime-notice.component.html',
  styleUrl: './runtime-notice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mode-notice',
    'aria-live': 'polite',
    '[class.is-stale]': 'stale()'
  }
})
export class RuntimeNoticeComponent {
  readonly mode = input.required<ApiMode>();
  readonly notice = input.required<string>();
  readonly stale = input.required<boolean>();
  readonly retryAvailable = input.required<boolean>();
  readonly retryRequested = output<void>();
}
