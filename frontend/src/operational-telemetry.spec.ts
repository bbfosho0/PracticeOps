import { createDemoDashboard } from './dashboard-model';
import {
  buildAuditTelemetry,
  buildClinicianLoad,
  buildDocumentationTelemetry,
  buildScheduleTelemetry,
  reconcileDashboard
} from './operational-telemetry';

describe('PracticeOps operational telemetry', () => {
  const now = new Date('2026-08-02T15:00:00-05:00');

  it('ships a synthetic dataset whose KPI values match its records', () => {
    const dashboard = reconcileDashboard(createDemoDashboard(now), now);
    const atRiskClaims = dashboard.claims.filter(claim => ['NeedsReview', 'Denied'].includes(claim.status));

    expect(dashboard.appointments.length).toBe(24);
    expect(dashboard.notes.length).toBe(24);
    expect(dashboard.claims.length).toBe(12);
    expect(dashboard.metrics.appointmentsToday).toBe(24);
    expect(dashboard.metrics.unsignedNotes).toBe(7);
    expect(dashboard.metrics.claimsAtRisk).toBe(12);
    expect(dashboard.metrics.claimExposure).toBe(54280);
    expect(dashboard.metrics.claimExposure).toBe(atRiskClaims.reduce((sum, claim) => sum + claim.amount, 0));
    expect(dashboard.metrics.teamUtilization).toBe(86);
  });

  it('reconciles stale API metrics from the records in the payload', () => {
    const source = createDemoDashboard(now);
    source.metrics = {
      appointmentsToday: 999,
      unsignedNotes: 999,
      claimsAtRisk: 999,
      claimExposure: 999,
      teamUtilization: 999
    };

    const reconciled = reconcileDashboard(source, now);

    expect(reconciled.metrics.appointmentsToday).toBe(24);
    expect(reconciled.metrics.unsignedNotes).toBe(7);
    expect(reconciled.metrics.claimsAtRisk).toBe(12);
    expect(reconciled.metrics.claimExposure).toBe(54280);
    expect(reconciled.metrics.teamUtilization).toBe(86);
  });

  it('derives schedule telemetry from appointment records', () => {
    const dashboard = reconcileDashboard(createDemoDashboard(now), now);
    const telemetry = buildScheduleTelemetry(dashboard, now);
    const clinicianLoad = buildClinicianLoad(dashboard, now);

    expect(telemetry.appointments).toBe(24);
    expect(telemetry.confirmed).toBeGreaterThan(0);
    expect(telemetry.capacityPercent).toBe(86);
    expect(telemetry.reminders.total).toBe(telemetry.reminders.text + telemetry.reminders.email + telemetry.reminders.call);
    expect(clinicianLoad.length).toBe(4);
    expect(clinicianLoad.every(item => item.utilization >= 0 && item.utilization <= 100)).toBeTrue();
  });

  it('derives documentation telemetry and aging buckets from notes', () => {
    const dashboard = reconcileDashboard(createDemoDashboard(now), now);
    const telemetry = buildDocumentationTelemetry(dashboard, now);

    expect(telemetry.total).toBe(24);
    expect(telemetry.unsigned).toBe(7);
    expect(telemetry.signed + telemetry.unsigned).toBe(telemetry.total);
    expect(telemetry.ageBuckets.underFourHours + telemetry.ageBuckets.fourToTwentyFourHours + telemetry.ageBuckets.overTwentyFourHours).toBe(telemetry.unsigned);
    expect(telemetry.completionRate).toBe(71);
  });

  it('derives audit KPIs, categories, and spectrum from audit events', () => {
    const dashboard = reconcileDashboard(createDemoDashboard(now), now);
    const telemetry = buildAuditTelemetry(dashboard);

    expect(telemetry.eventsToday).toBe(dashboard.audit.length);
    expect(telemetry.categories.reduce((sum, category) => sum + category.count, 0)).toBe(dashboard.audit.length);
    expect(telemetry.spectrum.length).toBe(72);
    expect(telemetry.spectrum.every(height => height >= 20 && height <= 96)).toBeTrue();
  });
});
