import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  AppointmentStatus,
  ClaimStatus,
  DashboardSnapshot,
  NoteStatus,
  PracticeOpsClient
} from '../../generated/practiceops-api-client';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import { PracticeOpsApiAdapter } from './practiceops-api.adapter';

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

  it('maps the generated dashboard contract into the stable application model', done => {
    const dashboard = createDashboardFixture();
    client.getDashboard.and.returnValue(of(dashboard as unknown as DashboardSnapshot));

    adapter.loadDashboard().subscribe(result => {
      expect(result).toEqual(dashboard);
      expect(result).not.toBe(dashboard);
      expect(client.getDashboard).toHaveBeenCalledOnceWith();
      done();
    });
  });

  it('returns the reset snapshot through the same contract mapping', done => {
    const dashboard = createDashboardFixture();
    client.resetPortfolioDemo.and.returnValue(of(dashboard as unknown as DashboardSnapshot));

    adapter.resetDemo().subscribe(result => {
      expect(result).toEqual(dashboard);
      expect(client.resetPortfolioDemo).toHaveBeenCalledOnceWith();
      done();
    });
  });

  it('forwards appointment transitions with the portfolio actor', () => {
    client.updateAppointmentStatus.and.returnValue(of({} as never));

    adapter.transitionAppointment('appointment-id', 'CheckedIn').subscribe();

    expect(client.updateAppointmentStatus).toHaveBeenCalledOnceWith('appointment-id', {
      status: AppointmentStatus.CheckedIn,
      actor: 'Portfolio reviewer'
    });
  });

  it('forwards note transitions with the portfolio actor', () => {
    client.updateClinicalNoteStatus.and.returnValue(of({} as never));

    adapter.transitionNote('note-id', 'Signed').subscribe();

    expect(client.updateClinicalNoteStatus).toHaveBeenCalledOnceWith('note-id', {
      status: NoteStatus.Signed,
      actor: 'Portfolio reviewer'
    });
  });

  it('forwards claim transitions with the portfolio actor', () => {
    client.updateClaimStatus.and.returnValue(of({} as never));

    adapter.transitionClaim('claim-id', 'Submitted').subscribe();

    expect(client.updateClaimStatus).toHaveBeenCalledOnceWith('claim-id', {
      status: ClaimStatus.Submitted,
      actor: 'Portfolio reviewer'
    });
  });

  it('rejects status values outside the generated contract before transport', () => {
    expect(() => adapter.transitionClaim('claim-id', 'Invented')).toThrowError(
      'Unsupported claim status: Invented'
    );
    expect(client.updateClaimStatus).not.toHaveBeenCalled();
  });

  it('propagates generated transport errors without activating fallback policy', done => {
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

  it('fails loudly when a required generated field is absent', done => {
    const snapshot = createDashboardFixture() as unknown as DashboardSnapshot;
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
});
