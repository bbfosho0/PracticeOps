import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SignalTone } from '../../dashboard-model';

export interface DocumentationQueueItem {
  readonly id: string;
  readonly clinician: string;
  readonly code: string;
  readonly status: string;
  readonly age: string;
  readonly tone: SignalTone;
}

@Component({
  selector: 'article[appDocumentationQueue]',
  standalone: true,
  templateUrl: './documentation-queue.component.html',
  styleUrl: './documentation-queue.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationQueueComponent {
  readonly items = input.required<readonly DocumentationQueueItem[]>();
  readonly unsigned = input.required<number>();
  readonly scenarioClinicalNoteId = input.required<string>();
}
