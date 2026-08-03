namespace PracticeOps.Api;

public sealed record PortfolioScenarioStep(
    string Id,
    string Label,
    string Description,
    string Workspace,
    string State);

public sealed record PortfolioScenario(
    string Id,
    string Title,
    Guid AppointmentId,
    Guid ClinicalNoteId,
    Guid ClaimId,
    int CompletedSteps,
    int TotalSteps,
    int CompletionPercent,
    string CurrentStepId,
    string CurrentWorkspace,
    IReadOnlyList<PortfolioScenarioStep> Steps);

public static class PortfolioScenarioBuilder
{
    public static PortfolioScenario Build(
        IReadOnlyList<Appointment> appointments,
        IReadOnlyList<ClinicalNote> notes,
        IReadOnlyList<Claim> claims)
    {
        var appointment = appointments.SingleOrDefault(item => item.PatientDisplayName == "Luna Baker")
            ?? appointments.FirstOrDefault(item => item.Status == AppointmentStatus.Scheduled)
            ?? throw new InvalidOperationException("The fictional portfolio appointment is unavailable.");
        var note = notes.SingleOrDefault(item => item.AppointmentId == appointment.Id)
            ?? throw new InvalidOperationException("The fictional portfolio clinical note is unavailable.");
        var claim = claims.SingleOrDefault(item => item.Number == "CLM-742198")
            ?? claims.FirstOrDefault(item => item.Status == ClaimStatus.NeedsReview)
            ?? throw new InvalidOperationException("The fictional portfolio claim is unavailable.");

        var submitted = claim.Status is ClaimStatus.Submitted or ClaimStatus.Paid or ClaimStatus.Denied;
        var definitions = new[]
        {
            new StepDefinition(
                "confirm-appointment",
                "Resolve the schedule exception",
                "Confirm Luna Baker's appointment so the operations runway reflects the staff action.",
                "schedule",
                appointment.Status != AppointmentStatus.Scheduled),
            new StepDefinition(
                "submit-note-review",
                "Submit the delayed note",
                "Move the related clinical note from draft into clinical review.",
                "documentation",
                note.Status != NoteStatus.Draft),
            new StepDefinition(
                "sign-note",
                "Complete the documentation",
                "Sign the reviewed note and make the encounter billing-ready.",
                "documentation",
                note.Status == NoteStatus.Signed),
            new StepDefinition(
                "clear-claim-risk",
                "Clear the claim risk",
                "Resolve the review exception and mark the claim ready for submission.",
                "claims",
                claim.Status is ClaimStatus.ReadyForSubmission or ClaimStatus.Submitted or ClaimStatus.Paid),
            new StepDefinition(
                "submit-claim",
                "Advance the claim",
                "Submit the validated fictional claim through the bounded workflow transition.",
                "claims",
                submitted),
            new StepDefinition(
                "inspect-proof",
                "Inspect audit and delivery proof",
                "Review the immutable audit trail and the transactional outbox result.",
                "audit",
                submitted)
        };

        var completed = definitions.Count(step => step.Complete);
        var currentIndex = Array.FindIndex(definitions, step => !step.Complete);
        if (currentIndex < 0) currentIndex = definitions.Length - 1;
        var steps = definitions.Select((step, index) => new PortfolioScenarioStep(
            step.Id,
            step.Label,
            step.Description,
            step.Workspace,
            step.Complete ? "complete" : index == currentIndex ? "current" : "pending")).ToArray();

        return new PortfolioScenario(
            "practiceops-exception-journey",
            "Resolve one exception from schedule to revenue proof",
            appointment.Id,
            note.Id,
            claim.Id,
            completed,
            definitions.Length,
            (int)Math.Round(completed * 100m / definitions.Length),
            definitions[currentIndex].Id,
            definitions[currentIndex].Workspace,
            steps);
    }

    private sealed record StepDefinition(
        string Id,
        string Label,
        string Description,
        string Workspace,
        bool Complete);
}
