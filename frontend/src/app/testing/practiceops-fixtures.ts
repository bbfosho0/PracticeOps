import type { ApiMode } from '../../runtime-model';
import { Dashboard, ViewId, createDemoDashboard } from '../../dashboard-model';
import { WorkspaceViewMetadata, WORKSPACE_VIEW_METADATA } from '../../app.component';

const FIXTURE_TIMESTAMP = new Date('2026-08-03T15:00:00.000Z');

export type Frozen<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly Frozen<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: Frozen<T[Key]> }
      : T;

export type DashboardFixture = Frozen<Dashboard>;

export interface RuntimeFixture {
  readonly dashboard: DashboardFixture;
  readonly views: Readonly<Record<ViewId, Frozen<WorkspaceViewMetadata>>>;
  readonly apiMode: ApiMode;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly mutationPending: boolean;
  readonly stale: boolean;
  readonly readOnly: boolean;
  readonly notice: string;
  readonly updatedLabel: string;
}

export type LiveRuntimeFixture = Frozen<RuntimeFixture & {
  readonly apiMode: 'live';
  readonly readOnly: false;
}>;

export type SyntheticRuntimeFixture = Frozen<RuntimeFixture & {
  readonly apiMode: 'demo';
  readonly readOnly: true;
}>;

export function createDashboardFixture(): DashboardFixture {
  return deepFreeze(cloneDashboard(createDemoDashboard(FIXTURE_TIMESTAMP)));
}

export function createLiveRuntimeFixture(): LiveRuntimeFixture {
  return deepFreeze({
    dashboard: createDashboardFixture(),
    views: cloneViews(),
    apiMode: 'live',
    loading: false,
    refreshing: false,
    mutationPending: false,
    stale: false,
    readOnly: false,
    notice: 'Live API data refreshed.',
    updatedLabel: 'Updated just now'
  });
}

export function createSyntheticRuntimeFixture(): SyntheticRuntimeFixture {
  return deepFreeze({
    dashboard: createDashboardFixture(),
    views: cloneViews(),
    apiMode: 'demo',
    loading: false,
    refreshing: false,
    mutationPending: false,
    stale: false,
    readOnly: true,
    notice: 'Synthetic preview — API unavailable. Persisted workflow actions are disabled.',
    updatedLabel: 'Not connected yet'
  });
}

function cloneDashboard(dashboard: Dashboard): Dashboard {
  return {
    ...dashboard,
    metrics: { ...dashboard.metrics },
    appointments: dashboard.appointments.map(appointment => ({ ...appointment })),
    notes: dashboard.notes.map(note => ({ ...note })),
    claims: dashboard.claims.map(claim => ({ ...claim })),
    audit: dashboard.audit.map(event => ({ ...event })),
    scenario: {
      ...dashboard.scenario,
      steps: dashboard.scenario.steps.map(step => ({ ...step }))
    },
    outbox: { ...dashboard.outbox }
  };
}

function cloneViews(): Readonly<Record<ViewId, Frozen<WorkspaceViewMetadata>>> {
  return Object.fromEntries(
    Object.entries(WORKSPACE_VIEW_METADATA).map(([view, metadata]) => [view, { ...metadata }])
  ) as Readonly<Record<ViewId, Frozen<WorkspaceViewMetadata>>>;
}

function deepFreeze<T>(value: T): Frozen<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(item => deepFreeze(item));
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
