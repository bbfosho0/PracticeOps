import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dashboard, createDemoDashboard } from './dashboard-model';
import { OperationalRefreshStore, relativeRefreshLabel, shouldPollOperationalData } from './operational-refresh.store';

function liveDashboard(): Dashboard {
  const dashboard = createDemoDashboard(new Date('2026-08-03T12:00:00Z'));
  return {
    ...dashboard,
    scenario: {
      ...dashboard.scenario,
      totalSteps: 5,
      steps: dashboard.scenario.steps.filter(step => step.id !== 'inspect-proof')
    },
    outbox: {
      ...dashboard.outbox,
      publishedMessages: 0
    }
  };
}

describe('Operational refresh policy', () => {
  it('polls only for visible live API data', () => {
    expect(shouldPollOperationalData('live', false)).toBeTrue();
    expect(shouldPollOperationalData('live', true)).toBeFalse();
    expect(shouldPollOperationalData('demo', false)).toBeFalse();
    expect(shouldPollOperationalData('connecting', false)).toBeFalse();
  });

  it('formats truthful relative refresh labels', () => {
    const now = new Date('2026-08-03T12:00:00Z');

    expect(relativeRefreshLabel(new Date('2026-08-03T11:59:55Z'), now)).toBe('Updated just now');
    expect(relativeRefreshLabel(new Date('2026-08-03T11:59:28Z'), now)).toBe('Updated 32 seconds ago');
    expect(relativeRefreshLabel(new Date('2026-08-03T11:57:00Z'), now)).toBe('Updated 3 minutes ago');
  });
});

describe('OperationalRefreshStore', () => {
  let store: OperationalRefreshStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    store = TestBed.inject(OperationalRefreshStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    store.ngOnDestroy();
    http.verify();
  });

  it('enters live mode after the authoritative dashboard loads', () => {
    http.expectOne('/api/dashboard').flush(liveDashboard());

    expect(store.apiMode()).toBe('live');
    expect(store.loading()).toBeFalse();
    expect(store.lastUpdatedAt()).not.toBeNull();
  });

  it('uses a read-only synthetic preview when the initial request fails', () => {
    http.expectOne('/api/dashboard').flush({}, { status: 503, statusText: 'Unavailable' });

    expect(store.apiMode()).toBe('demo');
    expect(store.notice()).toContain('Synthetic preview');
    expect(store.isReadOnly()).toBeTrue();
  });

  it('retains the last valid dashboard and clears stale copy after recovery', () => {
    const initial = liveDashboard();
    http.expectOne('/api/dashboard').flush(initial);

    store.refresh();
    http.expectOne('/api/dashboard').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.dashboard().metrics.appointmentsToday).toBe(initial.metrics.appointmentsToday);
    expect(store.stale()).toBeTrue();
    expect(store.notice()).toContain('last valid operational snapshot');

    store.refresh();
    http.expectOne('/api/dashboard').flush(initial);
    expect(store.stale()).toBeFalse();
    expect(store.notice()).toBe('Live data recovered.');
  });

  it('applies the reset response as the new authoritative snapshot', () => {
    http.expectOne('/api/dashboard').flush(liveDashboard());
    const reset = liveDashboard();
    reset.metrics.unsignedNotes = 7;

    store.resetDemo();
    http.expectOne('/api/demo/reset').flush(reset);

    expect(store.dashboard().metrics.unsignedNotes).toBe(7);
    expect(store.notice()).toContain('Portfolio scenario reset');
  });

  it('refreshes the dashboard after a successful mutation', () => {
    http.expectOne('/api/dashboard').flush(liveDashboard());

    store.runMutation(of({}), 'Saved.');
    http.expectOne('/api/dashboard').flush(liveDashboard());

    expect(store.mutationPending()).toBeFalse();
    expect(store.apiMode()).toBe('live');
  });
});
