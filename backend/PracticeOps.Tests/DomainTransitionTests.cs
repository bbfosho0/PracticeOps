using PracticeOps.Api;
using Xunit;

namespace PracticeOps.Tests;

public sealed class DomainTransitionTests
{
    [Theory]
    [InlineData(AppointmentStatus.CheckedIn)]
    [InlineData(AppointmentStatus.Cancelled)]
    public void Scheduled_appointment_can_transition_to_supported_status(AppointmentStatus next)
    {
        var appointment = NewAppointment();

        appointment.TransitionTo(next);

        Assert.Equal(next, appointment.Status);
    }

    [Theory]
    [InlineData(AppointmentStatus.CheckedIn, AppointmentStatus.InSession)]
    [InlineData(AppointmentStatus.InSession, AppointmentStatus.Completed)]
    public void Appointment_can_follow_required_workflow(AppointmentStatus first, AppointmentStatus second)
    {
        var appointment = NewAppointment();
        if (first == AppointmentStatus.InSession)
            appointment.TransitionTo(AppointmentStatus.CheckedIn);
        appointment.TransitionTo(first);

        appointment.TransitionTo(second);

        Assert.Equal(second, appointment.Status);
    }

    [Fact]
    public void Completed_appointment_cannot_transition_again()
    {
        var appointment = NewAppointment();
        appointment.TransitionTo(AppointmentStatus.CheckedIn);
        appointment.TransitionTo(AppointmentStatus.InSession);
        appointment.TransitionTo(AppointmentStatus.Completed);

        var exception = Assert.Throws<InvalidOperationException>(() => appointment.TransitionTo(AppointmentStatus.Cancelled));

        Assert.Contains("Completed", exception.Message);
    }

    [Fact]
    public void Draft_note_can_be_reviewed_and_signed()
    {
        var note = NewNote();
        note.TransitionTo(NoteStatus.InReview, DateTimeOffset.UtcNow);

        note.TransitionTo(NoteStatus.Signed, DateTimeOffset.UtcNow);

        Assert.Equal(NoteStatus.Signed, note.Status);
    }

    [Fact]
    public void Signed_note_cannot_return_to_draft()
    {
        var note = NewNote();
        note.TransitionTo(NoteStatus.InReview, DateTimeOffset.UtcNow);
        note.TransitionTo(NoteStatus.Signed, DateTimeOffset.UtcNow);

        Assert.Throws<InvalidOperationException>(() => note.TransitionTo(NoteStatus.Draft, DateTimeOffset.UtcNow));
    }

    [Theory]
    [InlineData(ClaimStatus.ReadyForSubmission)]
    [InlineData(ClaimStatus.Submitted)]
    [InlineData(ClaimStatus.Paid)]
    public void Claim_can_follow_submission_workflow(ClaimStatus finalStatus)
    {
        var claim = NewClaim();
        claim.TransitionTo(ClaimStatus.ReadyForSubmission, DateTimeOffset.UtcNow);
        if (finalStatus is ClaimStatus.Submitted or ClaimStatus.Paid)
            claim.TransitionTo(ClaimStatus.Submitted, DateTimeOffset.UtcNow);
        if (finalStatus is ClaimStatus.Paid)
            claim.TransitionTo(ClaimStatus.Paid, DateTimeOffset.UtcNow);

        Assert.Equal(finalStatus, claim.Status);
    }

    [Fact]
    public void Submitted_claim_can_be_denied_but_paid_claim_is_terminal()
    {
        var claim = NewClaim();
        claim.TransitionTo(ClaimStatus.ReadyForSubmission, DateTimeOffset.UtcNow);
        claim.TransitionTo(ClaimStatus.Submitted, DateTimeOffset.UtcNow);
        claim.TransitionTo(ClaimStatus.Denied, DateTimeOffset.UtcNow);
        Assert.Equal(ClaimStatus.Denied, claim.Status);

        var paidClaim = NewClaim();
        paidClaim.TransitionTo(ClaimStatus.ReadyForSubmission, DateTimeOffset.UtcNow);
        paidClaim.TransitionTo(ClaimStatus.Submitted, DateTimeOffset.UtcNow);
        paidClaim.TransitionTo(ClaimStatus.Paid, DateTimeOffset.UtcNow);
        Assert.Throws<InvalidOperationException>(() => paidClaim.TransitionTo(ClaimStatus.Denied, DateTimeOffset.UtcNow));
    }

    private static Appointment NewAppointment() => new() { PatientDisplayName = "Fictional Patient", Clinician = "Clinician", Service = "Therapy", StartsAt = DateTimeOffset.UtcNow };
    private static ClinicalNote NewNote() => new() { AppointmentId = Guid.NewGuid(), Clinician = "Clinician", DueAt = DateTimeOffset.UtcNow };
    private static Claim NewClaim() => new() { Number = "CLM-TEST", Payer = "Fictional Payer", Amount = 250m, RiskReason = "Validation" };
}
