import {
  createDashboardFixture,
  createLiveRuntimeFixture,
  createSyntheticRuntimeFixture
} from './practiceops-fixtures';

describe('PracticeOps deterministic UI fixtures', () => {
  it('creates the same fictional dashboard for every call', () => {
    const first = createDashboardFixture();
    const second = createDashboardFixture();

    expect(first).toEqual(second);
    expect(first.metrics).toEqual({
      appointmentsToday: 24,
      unsignedNotes: 7,
      claimsAtRisk: 12,
      claimExposure: 54280,
      teamUtilization: 86
    });
    expect(first.scenario.currentStepId).toBe('confirm-appointment');
  });

  it('returns deeply independent, frozen fixture graphs', () => {
    const first = createLiveRuntimeFixture();
    const second = createLiveRuntimeFixture();

    expect(first).not.toBe(second);
    expect(first.dashboard).not.toBe(second.dashboard);
    expect(first.dashboard.metrics).not.toBe(second.dashboard.metrics);
    expect(first.dashboard.appointments).not.toBe(second.dashboard.appointments);
    expect(first.dashboard.appointments[0]).not.toBe(second.dashboard.appointments[0]);
    expect(first.dashboard.scenario.steps).not.toBe(second.dashboard.scenario.steps);
    expect(first.dashboard.scenario.steps[0]).not.toBe(second.dashboard.scenario.steps[0]);
    expect(Object.isFrozen(first.dashboard)).toBeTrue();
    expect(Object.isFrozen(first.dashboard.scenario.steps[0])).toBeTrue();
  });

  it('provides all six workspace scenarios for live and synthetic runtime states', () => {
    const live = createLiveRuntimeFixture();
    const synthetic = createSyntheticRuntimeFixture();

    expect(Object.keys(live.views)).toEqual([
      'overview',
      'schedule',
      'documentation',
      'claims',
      'audit',
      'settings'
    ]);
    expect(live.views.claims.title).toBe('Risk constellation');
    expect(live.apiMode).toBe('live');
    expect(live.readOnly).toBeFalse();
    expect(synthetic.apiMode).toBe('demo');
    expect(synthetic.readOnly).toBeTrue();
    expect(synthetic.dashboard).toEqual(live.dashboard);
  });
});
