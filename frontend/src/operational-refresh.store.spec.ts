import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { PracticeOpsApiAdapter } from './app/api/practiceops-api.adapter';
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
  let api: jasmine.SpyObj<PracticeOpsApiAdapter>;
  let dashboardRequests: Subject<Dashboard>[];

  beforeEach(() => {
    dashboardRequests = [];
    api = jasmine.createSpyObj<PracticeOpsApiAdapter>('PracticeOpsApiAdapter', [
      'loadDashboard',
      'resetDemo',
      'transitionAppointment',
      'transitionNote',
      'transitionClaim'
    ]);
    api.loadDashboard.and.callFake(() => {
      const request = new Subject<Dashboard>();
      dashboardRequests.push(request);
      return request;
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PracticeOpsApiAdapter, useValue: api }
      ]
    });
    store = TestBed.inject(OperationalRefreshStore);
  });

  afterEach(() => {
    store.ngOnDestroy();
  });

  it('enters live mode after the authoritative dashboard loads', () => {
    dashboardRequests[0].next(liveDashboard());
    dashboardRequests[0].complete();

    expect(store.apiMode()).toBe('live');
    expect(store.loading()).toBeFalse();
    expect(store.lastUpdatedAt()).not.toBeNull();
  });

  it('uses a read-only synthetic preview when the initial request fails', () => {
    dashboardRequests[0].error(new Error('Unavailable'));

    expect(store.apiMode()).toBe('demo');
    expect(store.notice()).toContain('Synthetic preview');
    expect(store.isReadOnly()).toBeTrue();
  });

  it('retains the last valid dashboard and clears stale copy after recovery', () => {
    const initial = liveDashboard();
    dashboardRequests[0].next(initial);
    dashboardRequests[0].complete();

    store.refresh();
    dashboardRequests[1].error(new Error('Unavailable'));
    expect(store.dashboard().metrics.appointmentsToday).toBe(initial.metrics.appointmentsToday);
    expect(store.stale()).toBeTrue();
    expect(store.notice()).toContain('last valid operational snapshot');

    store.refresh();
    dashboardRequests[2].next(initial);
    dashboardRequests[2].complete();
    expect(store.stale()).toBeFalse();
    expect(store.notice()).toBe('Live data recovered.');
  });

  it('applies the reset response as the new authoritative snapshot', () => {
    dashboardRequests[0].next(liveDashboard());
    dashboardRequests[0].complete();
    const reset = liveDashboard();
    reset.metrics.unsignedNotes = 7;
    api.resetDemo.and.returnValue(of(reset));

    store.resetDemo();

    expect(store.dashboard().metrics.unsignedNotes).toBe(7);
    expect(store.notice()).toContain('Portfolio scenario reset');
  });

  it('refreshes the dashboard after a successful mutation', () => {
    dashboardRequests[0].next(liveDashboard());
    dashboardRequests[0].complete();

    store.runMutation(of({}), 'Saved.');
    dashboardRequests[1].next(liveDashboard());
    dashboardRequests[1].complete();

    expect(store.mutationPending()).toBeFalse();
    expect(store.apiMode()).toBe('live');
  });
});
