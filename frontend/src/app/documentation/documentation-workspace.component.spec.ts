import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildPipelineStages, createDemoDashboard } from '../../dashboard-model';
import { buildDocumentationTelemetry } from '../../operational-telemetry';
import { DocumentationWorkspaceComponent, buildDocumentationQueue } from './documentation-workspace.component';

describe('DocumentationWorkspaceComponent', () => {
  const referenceTime = new Date('2026-08-03T15:00:00.000Z');
  const dashboard = createDemoDashboard(referenceTime);

  beforeEach(() => TestBed.configureTestingModule({
    imports: [DocumentationWorkspaceComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function render(notes = dashboard.notes) {
    const fixture = TestBed.createComponent(DocumentationWorkspaceComponent);
    fixture.componentRef.setInput('pipeline', buildPipelineStages({ ...dashboard, notes: [...notes] }));
    fixture.componentRef.setInput('telemetry', buildDocumentationTelemetry({ ...dashboard, notes: [...notes] }));
    fixture.componentRef.setInput('notes', notes);
    fixture.componentRef.setInput('scenarioClinicalNoteId', dashboard.scenario.clinicalNoteId);
    fixture.componentRef.setInput('referenceTime', referenceTime);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the populated pipeline and highlights the scenario note in its focused queue', () => {
    const host = render();

    expect(host.querySelector('section[appDocumentationPipeline]')).not.toBeNull();
    expect(host.querySelectorAll('.note-row').length).toBeGreaterThan(0);
    expect(host.querySelector('.note-row.scenario-record')).not.toBeNull();
    expect(host.querySelector('.note-queue .workspace-empty')).toBeNull();
  });

  it('renders the completed empty queue when every note is signed', () => {
    const signedNotes = dashboard.notes.map(note => ({ ...note, status: 'Signed' as const }));
    const host = render(signedNotes);

    expect(host.querySelectorAll('.note-row').length).toBe(0);
    expect(host.querySelector('.note-queue .workspace-empty')?.textContent).toContain('All notes are signed.');
  });

  it('derives age labels from the supplied reference time instead of wall-clock time', () => {
    const queue = buildDocumentationQueue(dashboard.notes, referenceTime);

    expect(queue[0].age).toMatch(/^\d+[mhd]$/);
    expect(buildDocumentationQueue(dashboard.notes, referenceTime)).toEqual(queue);
  });
});
