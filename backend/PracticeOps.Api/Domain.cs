namespace PracticeOps.Api;

public enum AppointmentStatus { Scheduled, Confirmed, CheckedIn, Completed, Cancelled }
public enum NoteStatus { Draft, AwaitingSignature, Signed }
public enum ClaimStatus { Draft, Ready, Submitted, NeedsReview, Paid }

public sealed class Appointment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string PatientDisplayName { get; init; }
    public required string Clinician { get; init; }
    public required string Service { get; init; }
    public DateTimeOffset StartsAt { get; init; }
    public AppointmentStatus Status { get; private set; } = AppointmentStatus.Scheduled;

    public void TransitionTo(AppointmentStatus next)
    {
        var allowed = Status switch
        {
            AppointmentStatus.Scheduled => next is AppointmentStatus.Confirmed or AppointmentStatus.Cancelled,
            AppointmentStatus.Confirmed => next is AppointmentStatus.CheckedIn or AppointmentStatus.Cancelled,
            AppointmentStatus.CheckedIn => next is AppointmentStatus.Completed,
            _ => false
        };
        if (!allowed) throw new InvalidOperationException($"Appointment cannot move from {Status} to {next}.");
        Status = next;
    }
}

public sealed class ClinicalNote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AppointmentId { get; init; }
    public required string Clinician { get; init; }
    public DateTimeOffset DueAt { get; init; }
    public NoteStatus Status { get; private set; } = NoteStatus.Draft;
    public DateTimeOffset? SignedAt { get; private set; }

    public void TransitionTo(NoteStatus next, DateTimeOffset now)
    {
        var allowed = Status switch
        {
            NoteStatus.Draft => next == NoteStatus.AwaitingSignature,
            NoteStatus.AwaitingSignature => next == NoteStatus.Signed,
            _ => false
        };
        if (!allowed) throw new InvalidOperationException($"Note cannot move from {Status} to {next}.");
        Status = next;
        if (next == NoteStatus.Signed) SignedAt = now;
    }
}

public sealed class Claim
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Number { get; init; }
    public required string Payer { get; init; }
    public decimal Amount { get; init; }
    public required string RiskReason { get; set; }
    public ClaimStatus Status { get; private set; } = ClaimStatus.Draft;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public void TransitionTo(ClaimStatus next, DateTimeOffset now)
    {
        var allowed = next == ClaimStatus.NeedsReview || Status switch
        {
            ClaimStatus.Draft => next == ClaimStatus.Ready,
            ClaimStatus.Ready => next == ClaimStatus.Submitted,
            ClaimStatus.Submitted => next == ClaimStatus.Paid,
            ClaimStatus.NeedsReview => next is ClaimStatus.Ready or ClaimStatus.Submitted,
            _ => false
        };
        if (!allowed) throw new InvalidOperationException($"Claim cannot move from {Status} to {next}.");
        Status = next;
        UpdatedAt = now;
    }
}

public sealed class AuditEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Actor { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required string EntityId { get; init; }
    public required string Summary { get; init; }
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class OutboxMessage
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EventType { get; init; }
    public required string Payload { get; init; }
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
}
