import {
  buildPipelineStages,
  buildRiskDistribution,
  createDemoDashboard,
  humanizeStatus,
  initials,
  toneForStatus
} from './dashboard-model';

describe('PracticeOps clinical observatory model', () => {
  const now = new Date('2026-08-02T15:00:00-05:00');
  const dashboard = createDemoDashboard(now);

  it('creates a complete synthetic dashboard without real records', () => {
    expect(dashboard.metrics.appointmentsToday).toBe(24);
    expect(dashboard.appointments.length).toBe(24);
    expect(dashboard.notes.length).toBe(24);
    expect(dashboard.claims.length).toBe(12);
    expect(dashboard.claims.every(claim => claim.id.startsWith('demo-claim-'))).toBeTrue();
  });

  it('builds the documentation continuum in the correct order', () => {
    const stages = buildPipelineStages(dashboard);

    expect(stages.map(stage => stage.label)).toEqual([
      'Capture',
      'Review',
      'Signature',
      'Final QA',
      'Billing ready'
    ]);
    expect(stages[0].value).toBe(dashboard.notes.length);
    expect(stages[1].value).toBe(dashboard.metrics.unsignedNotes);
    expect(stages[2].value).toBe(dashboard.notes.filter(note => note.status === 'InReview').length);
    expect(stages[4].value).toBe(dashboard.notes.filter(note => note.status === 'Signed').length);
  });

  it('groups claims into operational risk categories', () => {
    const distribution = buildRiskDistribution(dashboard);
    const totalClaims = distribution.reduce((total, item) => total + item.count, 0);
    const totalExposure = distribution.reduce((total, item) => total + item.exposure, 0);

    expect(totalClaims).toBe(dashboard.claims.length);
    expect(totalExposure).toBe(dashboard.claims.reduce((total, claim) => total + claim.amount, 0));
  });

  it('normalizes labels and visual tones consistently', () => {
    expect(humanizeStatus('NeedsReview')).toBe('Needs Review');
    expect(initials('Maya Johnson')).toBe('MJ');
    expect(toneForStatus('Signed')).toBe('green');
    expect(toneForStatus('NeedsReview')).toBe('cyan');
  });
});
