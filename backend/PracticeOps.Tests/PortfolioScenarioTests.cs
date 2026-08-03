using PracticeOps.Api;
using Xunit;

namespace PracticeOps.Tests;

public sealed class PortfolioScenarioTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Build_selects_the_seeded_exception_records()
    {
        var dataset = FictionalSeed.BuildDataset(Now);

        var scenario = PortfolioScenarioBuilder.Build(dataset.Appointments, dataset.Notes, dataset.Claims);

        Assert.Equal("practiceops-exception-journey", scenario.Id);
        Assert.Equal("Luna Baker", dataset.Appointments.Single(x => x.Id == scenario.AppointmentId).PatientDisplayName);
        Assert.Equal(scenario.AppointmentId, dataset.Notes.Single(x => x.Id == scenario.ClinicalNoteId).AppointmentId);
        Assert.Equal("CLM-742198", dataset.Claims.Single(x => x.Id == scenario.ClaimId).Number);
        Assert.Equal("schedule", scenario.CurrentWorkspace);
        Assert.Equal(0, scenario.CompletedSteps);
    }

    [Fact]
    public void Progress_is_derived_from_authoritative_entity_states()
    {
        var dataset = FictionalSeed.BuildDataset(Now);
        var appointment = dataset.Appointments.Single(x => x.PatientDisplayName == "Luna Baker");
        var note = dataset.Notes.Single(x => x.AppointmentId == appointment.Id);
        var claim = dataset.Claims.Single(x => x.Number == "CLM-742198");

        appointment.TransitionTo(AppointmentStatus.Confirmed);
        note.TransitionTo(NoteStatus.InReview, Now);
        note.TransitionTo(NoteStatus.Signed, Now);
        claim.TransitionTo(ClaimStatus.ReadyForSubmission, Now);

        var scenario = PortfolioScenarioBuilder.Build(dataset.Appointments, dataset.Notes, dataset.Claims);

        Assert.Equal(4, scenario.CompletedSteps);
        Assert.Equal("claims", scenario.CurrentWorkspace);
        Assert.Equal(67, scenario.CompletionPercent);
    }
}
