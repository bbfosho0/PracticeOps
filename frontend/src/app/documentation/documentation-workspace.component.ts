import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClinicalNote, PipelineStage, SignalTone, humanizeStatus, toneForStatus } from '../../dashboard-model';
import { DocumentationTelemetry } from '../../operational-telemetry';
import { DocumentationPipelineComponent } from './documentation-pipeline.component';
import { DocumentationQueueComponent, DocumentationQueueItem } from './documentation-queue.component';

export interface DocumentationFollowUp {
  readonly label: string;
  readonly detail: string;
  readonly count: number;
  readonly tone: SignalTone;
}

export interface DocumentationHealthItem {
  readonly value: string;
  readonly label: string;
  readonly tone: SignalTone;
}

export function buildDocumentationQueue(notes: readonly ClinicalNote[], referenceTime: Date): readonly DocumentationQueueItem[] {
  return notes.filter(note => note.status !== 'Signed').slice(0, 7).map((note, index) => ({
    id: note.id,
    clinician: note.clinician,
    code: index % 2 === 0 ? '90837 · Individual therapy' : '90791 · Diagnostic evaluation',
    status: humanizeStatus(note.status),
    age: ageLabel(hoursSince(note.dueAt, referenceTime)),
    tone: toneForStatus(note.status)
  }));
}

export function buildDocumentationFollowUps(telemetry: Readonly<DocumentationTelemetry>): readonly DocumentationFollowUp[] {
  return [
    { label: 'Draft notes', detail: 'Documentation still in capture', count: telemetry.draft, tone: 'violet' },
    { label: 'Awaiting signature', detail: 'Clinician review is complete', count: telemetry.inReview, tone: 'amber' },
    { label: 'Over 24 hours', detail: 'Past the documentation target', count: telemetry.ageBuckets.overTwentyFourHours, tone: 'coral' },
    { label: 'Due within 24 hours', detail: 'Needs near-term attention', count: telemetry.ageBuckets.fourToTwentyFourHours, tone: 'cyan' }
  ];
}

export function buildDocumentationHealth(telemetry: Readonly<DocumentationTelemetry>): readonly DocumentationHealthItem[] {
  const onTimeRate = telemetry.unsigned === 0 ? 100 : Math.round(((telemetry.unsigned - telemetry.ageBuckets.overTwentyFourHours) / telemetry.unsigned) * 100);
  return [
    { value: `${Math.max(0, 100 - telemetry.returnedRate)}`, label: 'Quality score', tone: 'cyan' },
    { value: `${telemetry.completionRate}%`, label: 'Complete notes', tone: 'green' },
    { value: `${telemetry.returnedRate}%`, label: 'Draft rate', tone: 'violet' },
    { value: `${telemetry.averageAgeHours}h`, label: 'Average unsigned age', tone: 'blue' },
    { value: `${onTimeRate}%`, label: 'Within 24-hour target', tone: 'green' }
  ];
}

function hoursSince(value: string, reference: Date): number {
  return Math.max(0, (reference.getTime() - new Date(value).getTime()) / 3_600_000);
}

function ageLabel(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

@Component({
  selector: 'div[appDocumentationWorkspace]',
  standalone: true,
  imports: [DocumentationPipelineComponent, DocumentationQueueComponent],
  templateUrl: './documentation-workspace.component.html',
  styleUrl: './documentation-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'documentation-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class DocumentationWorkspaceComponent {
  readonly pipeline = input.required<readonly PipelineStage[]>();
  readonly telemetry = input.required<Readonly<DocumentationTelemetry>>();
  readonly notes = input.required<readonly ClinicalNote[]>();
  readonly scenarioClinicalNoteId = input.required<string>();
  readonly referenceTime = input.required<Date>();
  readonly noteQueue = computed(() => buildDocumentationQueue(this.notes(), this.referenceTime()));
  readonly priorityFollowUps = computed(() => buildDocumentationFollowUps(this.telemetry()));
  readonly documentationHealth = computed(() => buildDocumentationHealth(this.telemetry()));
}
