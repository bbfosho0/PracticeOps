import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  ApiException,
  Appointment as GeneratedAppointment,
  AppointmentStatus,
  Claim as GeneratedClaim,
  ClaimStatus,
  ClinicalNote as GeneratedClinicalNote,
  DashboardSnapshot,
  NoteStatus,
  PracticeOpsClient
} from '../../generated/practiceops-api-client';
import {
  Appointment,
  Claim,
  ClinicalNote,
  Dashboard
} from '../../dashboard-model';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import { PracticeOpsApiAdapter } from './practiceops-api.adapter';

function dashboardContract(): { generated: DashboardSnapshot; expected: Dashboard } {
  const expected = JSON.parse(JSON.stringify(createDashboardFixture())) as Dashboard;
  expected.audit = expected.audit.map((event, index) => ({
    ...event,
    entityType: event.entityType ?? 'Appointment',
    entityId: event.entityId ?? `appointment-${index + 1}`
  }));
  return {
    generated: JSON.parse(JSON.stringify(expected)) as DashboardSnapshot,
    expected
  };
}

describe('PracticeOpsApiAdapter', () => {
  let adapter: PracticeOpsApiAdapter;
  let client: jasmine.SpyObj<PracticeOpsClient>;

  beforeEach(() => {
    client = jasmine.createSpyObj<PracticeOpsClient>('PracticeOpsClient', [
      'getDashboard',
      'resetPortfolioDemo',
      'updateAppointmentStatus',
      'updateClinicalNoteStatus',
      'updateClaimStatus'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PracticeOpsApiAdapter,
        { provide: PracticeOpsClient, useValue: client }
      ]
    });
    adapter = TestBed.inject(PracticeOpsApiAdapter);
  });

  it('maps the generated dashboard contract into the stable application model', async () => {
    const { generated, expected } = dashboardContract();
    client.getDashboard.and.returnValue(of(generated));

    const result = await firstValueFrom(adapter.loadDashboard());

    expect(result).toEqual(expected);
    expect(result).not.toBe(generated as unknown as Dashboard);
    expect(client.getDashboard).toHaveBeenCalledOnceWith();
  });

  it('returns the reset snapshot through the same contract mapping', async () => {
    const { generated, expected } = dashboardContract();
    client.resetPortfolioDemo.and.returnValue(of(generated));

    expect(await firstValueFrom(adapter.resetDemo())).toEqual(expected);
    expect(client.resetPortfolioDemo).toHaveBeenCalledOnceWith();
  });

  it('maps appointment mutations and forwards the portfolio actor', async () => {
    const generated: GeneratedAppointment = {
      id: 'appointment-id',
      patientDisplayName: 'Fictional patient',
      clinician: 'Fictional clinician',
      service: 'Individual therapy',
      startsAt: '2026-08-03T15:00:00.000Z',
      status: AppointmentStatus.CheckedIn
    };
    client.updateAppointmentStatus.and.returnValue(of(generated));

    const result = await firstValueFrom(adapter.transitionAppointment('appointment-id', 'CheckedIn'));

    expect(client.updateAppointmentStatus).toHaveBeenCalledOnceWith('appointment-id', {
      status: AppointmentStatus.CheckedIn,
      actor: 'Portfolio reviewer'
    });
    expect(result).toEqual({
      id: 'appointment-id',
      patientDisplayName: 'Fictional patient',
      clinician: 'Fictional clinician',
      service: 'Individual therapy',
      startsAt: '2026-08-03T15:00:00.000Z',
      status: 'CheckedIn'
    } satisfies Appointment);
    expect(result).not.toBe(generated as unknown as Appointment);
  });

  it('maps note mutations and forwards the portfolio actor', async () => {
    const generated: GeneratedClinicalNote = {
      id: 'note-id',
      appointmentId: 'appointment-id',
      clinician: 'Fictional clinician',
      dueAt: '2026-08-03T16:00:00.000Z',
      status: NoteStatus.Signed,
      signedAt: '2026-08-03T15:30:00.000Z'
    };
    client.updateClinicalNoteStatus.and.returnValue(of(generated));

    const result = await firstValueFrom(adapter.transitionNote('note-id', 'Signed'));

    expect(client.updateClinicalNoteStatus).toHaveBeenCalledOnceWith('note-id', {
      status: NoteStatus.Signed,
      actor: 'Portfolio reviewer'
    });
    expect(result).toEqual({
      id: 'note-id',
      appointmentId: 'appointment-id',
      clinician: 'Fictional clinician',
      dueAt: '2026-08-03T16:00:00.000Z',
      status: 'Signed'
    } satisfies ClinicalNote);
  });

  it('maps claim mutations and forwards the portfolio actor', async () => {
    const generated: GeneratedClaim = {
      id: 'claim-id',
      number: 'CLM-000001',
      payer: 'Fictional payer',
      amount: 1234,
      riskReason: 'Authorization required',
      status: ClaimStatus.Submitted,
      updatedAt: '2026-08-03T15:30:00.000Z'
    };
    client.updateClaimStatus.and.returnValue(of(generated));

    const result = await firstValueFrom(adapter.transitionClaim('claim-id', 'Submitted'));

    expect(client.updateClaimStatus).toHaveBeenCalledOnceWith('claim-id', {
      status: ClaimStatus.Submitted,
      actor: 'Portfolio reviewer'
    });
    expect(result).toEqual({
      id: 'claim-id',
      number: 'CLM-000001',
      payer: 'Fictional payer',
      amount: 1234,
      riskReason: 'Authorization required',
      status: 'Submitted'
    } satisfies Claim);
  });

  it('rejects status values outside the generated contract before transport', () => {
    expect(() => adapter.transitionClaim('claim-id', 'Invented')).toThrowError(
      'Unsupported claim status: Invented'
    );
    expect(client.updateClaimStatus).not.toHaveBeenCalled();
  });

  it('propagates non-API transport errors without activating fallback policy', done => {
    const error = new Error('transport failed');
    client.getDashboard.and.returnValue(throwError(() => error));

    adapter.loadDashboard().subscribe({
      next: () => fail('Expected the transport error to propagate.'),
      error: received => {
        expect(received).toBe(error);
        done();
      }
    });
  });

  it('preserves generated API problem details using the existing HttpClient error shape', done => {
    const error = new ApiException(
      'Conflict',
      409,
      '{"detail":"The fictional transition is invalid."}',
      {},
      { detail: 'The fictional transition is invalid.' }
    );
    client.updateClaimStatus.and.returnValue(throwError(() => error));

    adapter.transitionClaim('claim-id', 'Submitted').subscribe({
      next: () => fail('Expected the generated API error to propagate.'),
      error: received => {
        expect(received instanceof HttpErrorResponse).toBeTrue();
        expect(received.status).toBe(409);
        expect(received.error.detail).toBe('The fictional transition is invalid.');
        done();
      }
    });
  });

  it('normalizes the plain problem-detail object emitted by generated NSwag failures', done => {
    const problemDetail = {
      status: 409,
      statusText: 'Conflict',
      response: '{"detail":"The generated transition is invalid."}',
      error: 'Conflict',
      detail: 'The generated transition is invalid.'
    };
    client.updateClaimStatus.and.returnValue(throwError(() => problemDetail));

    adapter.transitionClaim('claim-id', 'Submitted').subscribe({
      next: () => fail('Expected the generated problem detail to propagate.'),
      error: received => {
        expect(received instanceof HttpErrorResponse).toBeTrue();
        expect(received.status).toBe(409);
        expect(received.statusText).toBe('Conflict');
        expect(received.error).toBe(problemDetail);
        expect(received.error.detail).toBe('The generated transition is invalid.');
        done();
      }
    });
  });

  it('fails loudly when a required generated dashboard field is absent', done => {
    const { generated: snapshot } = dashboardContract();
    snapshot.metrics = undefined;
    client.getDashboard.and.returnValue(of(snapshot));

    adapter.loadDashboard().subscribe({
      next: () => fail('Expected a contract validation error.'),
      error: error => {
        expect(error.message).toContain('dashboard.metrics is required');
        done();
      }
    });
  });

  it('rejects generated scenario values outside the application contract', done => {
    const { generated: snapshot } = dashboardContract();
    snapshot.scenario!.steps![0].workspace = 'invented';
    client.getDashboard.and.returnValue(of(snapshot));

    adapter.loadDashboard().subscribe({
      next: () => fail('Expected a contract validation error.'),
      error: error => {
        expect(error.message).toContain('dashboard.scenario.steps[0].workspace');
        done();
      }
    });
  });

  it('rejects a mutation response with a missing required field', done => {
    client.updateClinicalNoteStatus.and.returnValue(of({
      appointmentId: 'appointment-id',
      clinician: 'Fictional clinician',
      dueAt: '2026-08-03T16:00:00.000Z',
      status: NoteStatus.InReview
    }));

    adapter.transitionNote('note-id', 'InReview').subscribe({
      next: () => fail('Expected a contract validation error.'),
      error: error => {
        expect(error.message).toContain('note mutation.id is required');
        done();
      }
    });
  });
});
