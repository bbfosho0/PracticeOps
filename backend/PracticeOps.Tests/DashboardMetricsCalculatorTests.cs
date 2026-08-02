using PracticeOps.Api;
using Xunit;

namespace PracticeOps.Tests;

public sealed class DashboardMetricsCalculatorTests
{
    [Fact]
    public void Fictional_seed_records_reconcile_with_dashboard_metrics()
    {
        var now = new DateTimeOffset(2026, 8, 2, 12, 0, 0, TimeSpan.Zero);
        var seed = FictionalSeed.BuildDataset(now);

        var metrics = DashboardMetricsCalculator.Calculate(seed.Appointments, seed.Notes, seed.Claims);

        Assert.Equal(24, seed.Appointments.Count);
        Assert.Equal(24, seed.Notes.Count);
        Assert.Equal(12, seed.Claims.Count);
        Assert.Equal(12, seed.Audit.Count);
        Assert.Equal(24, metrics.AppointmentsToday);
        Assert.Equal(7, metrics.UnsignedNotes);
        Assert.Equal(12, metrics.ClaimsAtRisk);
        Assert.Equal(54280m, metrics.ClaimExposure);
        Assert.Equal(86, metrics.TeamUtilization);
    }

    [Fact]
    public void Calculator_derives_values_from_record_statuses()
    {
        var now = DateTimeOffset.UtcNow;
        var appointment = new Appointment
        {
            PatientDisplayName = "Synthetic Patient",
            Clinician = "Clinician A",
            Service = "Therapy",
            StartsAt = now
        };
        appointment.TransitionTo(AppointmentStatus.Cancelled);

        var note = new ClinicalNote
        {
            AppointmentId = appointment.Id,
            Clinician = appointment.Clinician,
            DueAt = now
        };

        var claim = new Claim
        {
            Number = "CLM-TEST",
            Payer = "Synthetic Payer",
            Amount = 900m,
            RiskReason = "Validation"
        };
        claim.TransitionTo(ClaimStatus.NeedsReview, now);

        var metrics = DashboardMetricsCalculator.Calculate([appointment], [note], [claim]);

        Assert.Equal(1, metrics.AppointmentsToday);
        Assert.Equal(1, metrics.UnsignedNotes);
        Assert.Equal(1, metrics.ClaimsAtRisk);
        Assert.Equal(900m, metrics.ClaimExposure);
        Assert.Equal(0, metrics.TeamUtilization);
    }
}
