import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, finalize } from 'rxjs';
import { Dashboard, DashboardMetrics, createDemoDashboard } from './dashboard-model';
import { reconcileDashboard } from './operational-telemetry';
import { PracticeOpsApiService } from './practiceops-api.service';

export type ApiMode = 'connecting' | 'live' | 'demo';
type RefreshReason = 'initial' | 'manual' | 'poll' | 'mutation' | 'reset' | 'recovery';

export function shouldPollOperationalData(mode: ApiMode, hidden: boolean): boolean {
  return mode === 'live' && !hidden;
}

export function relativeRefreshLabel(value: Date | null, now = new Date()): string {
  if (!value) return 'Not connected yet';
  const seconds = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 1000));
  if (seconds < 10) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}

@Injectable({ providedIn: 'root' })
export class OperationalRefreshStore implements OnDestroy {
  private readonly api = inject(PracticeOpsApiService);
  private inFlight?: Subscription;
  private mutationSubscription?: Subscription;
  private pollTimer?: number;
  private relativeTimeTimer?: number;
  private refreshQueued = false;
  private readonly clock = signal(new Date());
  private readonly visibilityListener = () => {
    this.clock.set(new Date());
    if (typeof document !== 'undefined' && shouldPollOperationalData(this.apiMode(), document.hidden))
      this.refresh('recovery');
  };

  readonly dashboard = signal<Dashboard>(reconcileDashboard(createDemoDashboard()));
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly mutationPending = signal(false);
  readonly apiMode = signal<ApiMode>('connecting');
  readonly notice = signal('Connecting to the PracticeOps API…');
  readonly lastUpdatedAt = signal<Date | null>(null);
  readonly stale = signal(false);
  readonly kpiAnnouncement = signal('');
  readonly isReadOnly = computed(() => this.apiMode() !== 'live');
  readonly updatedLabel = computed(() => relativeRefreshLabel(this.lastUpdatedAt(), this.clock()));

  constructor() {
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', this.visibilityListener);
    if (typeof window !== 'undefined') {
      this.pollTimer = window.setInterval(() => {
        if (typeof document !== 'undefined' && shouldPollOperationalData(this.apiMode(), document.hidden))
          this.refresh('poll');
      }, 45_000);
      this.relativeTimeTimer = window.setInterval(() => this.clock.set(new Date()), 10_000);
    }
    this.refresh('initial');
  }

  refresh(reason: RefreshReason = 'manual'): void {
    if (this.inFlight) {
      if (reason === 'mutation' || reason === 'reset' || reason === 'manual')
        this.refreshQueued = true;
      return;
    }

    if (reason === 'initial') {
      this.loading.set(true);
      this.apiMode.set('connecting');
    } else {
      this.refreshing.set(true);
    }

    this.inFlight = this.api.loadDashboard().pipe(finalize(() => {
      this.inFlight = undefined;
      this.loading.set(false);
      this.refreshing.set(false);
      if (this.refreshQueued) {
        this.refreshQueued = false;
        this.refresh('recovery');
      }
    })).subscribe({
      next: value => this.applyLiveDashboard(value, reason === 'poll' ? '' : 'Live API data refreshed.'),
      error: error => this.handleRefreshFailure(error)
    });
  }

  resetDemo(): void {
    if (this.apiMode() !== 'live') {
      this.notice.set('Persisted demo reset requires the live API. Retry the connection first.');
      return;
    }
    if (this.mutationPending()) return;

    this.mutationPending.set(true);
    this.notice.set('Resetting the fictional portfolio scenario…');
    this.mutationSubscription?.unsubscribe();
    this.mutationSubscription = this.api.resetDemo().pipe(finalize(() => this.mutationPending.set(false))).subscribe({
      next: value => this.applyLiveDashboard(value, 'Portfolio scenario reset. Begin with the schedule exception.', false),
      error: error => this.notice.set(this.problemDetail(error, 'The portfolio scenario could not be reset.'))
    });
  }

  runMutation(operation: Observable<unknown>, successMessage: string): void {
    if (this.apiMode() !== 'live') {
      this.notice.set('This synthetic preview is read-only. Persisted workflow actions require the live API.');
      return;
    }
    if (this.mutationPending()) return;

    this.mutationPending.set(true);
    this.mutationSubscription?.unsubscribe();
    this.mutationSubscription = operation.pipe(finalize(() => this.mutationPending.set(false))).subscribe({
      next: () => {
        this.notice.set(successMessage);
        this.refresh('mutation');
      },
      error: error => this.notice.set(this.problemDetail(error, 'The workflow action could not be completed.'))
    });
  }

  ngOnDestroy(): void {
    this.inFlight?.unsubscribe();
    this.mutationSubscription?.unsubscribe();
    if (this.pollTimer !== undefined && typeof window !== 'undefined')
      window.clearInterval(this.pollTimer);
    if (this.relativeTimeTimer !== undefined && typeof window !== 'undefined')
      window.clearInterval(this.relativeTimeTimer);
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  private applyLiveDashboard(value: Dashboard, notice: string, recoveryAware = true): void {
    const recovered = recoveryAware && this.stale();
    const reference = value.appointments[0] ? new Date(value.appointments[0].startsAt) : new Date();
    const reconciled = reconcileDashboard(value, reference);
    this.announceMetricChanges(this.dashboard().metrics, reconciled.metrics);
    this.dashboard.set(reconciled);
    this.apiMode.set('live');
    const refreshedAt = new Date();
    this.lastUpdatedAt.set(refreshedAt);
    this.clock.set(refreshedAt);
    this.stale.set(false);
    if (recovered) this.notice.set('Live data recovered.');
    else if (notice) this.notice.set(notice);
  }

  private handleRefreshFailure(error: unknown): void {
    if (this.apiMode() === 'live' && this.lastUpdatedAt()) {
      this.stale.set(true);
      this.notice.set(this.problemDetail(error, 'Live refresh failed. The last valid operational snapshot remains visible.'));
      return;
    }

    this.dashboard.set(reconcileDashboard(createDemoDashboard()));
    this.apiMode.set('demo');
    this.stale.set(false);
    this.notice.set('Synthetic preview — API unavailable. Persisted workflow actions are disabled.');
  }

  private problemDetail(error: unknown, fallback: string): string {
    const httpError = error as HttpErrorResponse;
    const detail = typeof httpError?.error?.detail === 'string' ? httpError.error.detail : '';
    return detail || fallback;
  }

  private announceMetricChanges(previous: DashboardMetrics, current: DashboardMetrics): void {
    const changed = [
      ['Appointments today', previous.appointmentsToday, current.appointmentsToday],
      ['Unsigned notes', previous.unsignedNotes, current.unsignedNotes],
      ['Claims at risk', previous.claimsAtRisk, current.claimsAtRisk],
      ['Team utilization', previous.teamUtilization, current.teamUtilization]
    ].filter(([, before, after]) => before !== after)
      .map(([label, , after]) => `${label}: ${after}`);
    this.kpiAnnouncement.set(changed.length ? `Operational metrics updated. ${changed.join(', ')}.` : '');
  }
}
