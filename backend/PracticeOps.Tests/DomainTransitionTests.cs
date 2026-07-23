using PracticeOps.Api;

namespace PracticeOps.Tests;

public sealed class DomainTransitionTests
{
    [Fact]
    public void Appointment_requires_ordered_progression()
    {
        var appointment = new Appointment
        {
            PatientDisplayName = "Fictional Patient",
            Clinician = "Clinician",
            Service = "Therapy",
            StartsAt = DateTimeOffset.UtcNow
        };

        Assert.Throws<InvalidOperationException>(() => appointment.TransitionTo(AppointmentStatus.Completed));
        appointment.TransitionTo(AppointmentStatus.Confirmed);
        appointment.TransitionTo(AppointmentStatus.CheckedIn);
        appointment.TransitionTo(AppointmentStatus.Completed);
        Assert.Equal(AppointmentStatus.Completed, appointment.Status);
    }

    [Fact]
    public void Signed_note_is_immutable()
    {
        var note = new ClinicalNote { AppointmentId = Guid.NewGuid(), Clinician = "Clinician", DueAt = DateTimeOffset.UtcNow };
        note.TransitionTo(NoteStatus.AwaitingSignature, DateTimeOffset.UtcNow);
        note.TransitionTo(NoteStatus.Signed, DateTimeOffset.UtcNow);

        Assert.Equal(NoteStatus.Signed, note.Status);
        Assert.NotNull(note.SignedAt);
        Assert.Throws<InvalidOperationException>(() => note.TransitionTo(NoteStatus.Draft, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Claim_can_enter_review_from_any_active_state()
    {
        var claim = new Claim { Number = "CLM-TEST", Payer = "Fictional Payer", Amount = 250m, RiskReason = "Validation" };
        claim.TransitionTo(ClaimStatus.Ready, DateTimeOffset.UtcNow);
        claim.TransitionTo(ClaimStatus.NeedsReview, DateTimeOffset.UtcNow);
        Assert.Equal(ClaimStatus.NeedsReview, claim.Status);
    }
}
