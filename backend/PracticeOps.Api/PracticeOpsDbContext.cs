using Microsoft.EntityFrameworkCore;

namespace PracticeOps.Api;

public sealed class PracticeOpsDbContext(DbContextOptions<PracticeOpsDbContext> options) : DbContext(options)
{
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ClinicalNote> ClinicalNotes => Set<ClinicalNote>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Appointment>().Property(x => x.Status).HasConversion<string>();
        modelBuilder.Entity<ClinicalNote>().Property(x => x.Status).HasConversion<string>();
        modelBuilder.Entity<Claim>().Property(x => x.Status).HasConversion<string>();
        modelBuilder.Entity<Claim>().Property(x => x.Amount).HasPrecision(12, 2);
        modelBuilder.Entity<OutboxMessage>().HasIndex(x => x.ProcessedAt);
    }
}

public sealed record FictionalSeedDataset(
    IReadOnlyList<Appointment> Appointments,
    IReadOnlyList<ClinicalNote> Notes,
    IReadOnlyList<Claim> Claims,
    IReadOnlyList<AuditEntry> Audit);

public static class FictionalSeed
{
    private static readonly string[] Patients =
    [
        "Maya Johnson", "Ethan Brooks", "Sophia Lee", "Noah Carter", "Mia Thompson", "Chris Rivera",
        "Jordan Taylor", "Avery Wilson", "Olivia Martin", "Liam Davis", "Emma Clark", "Lucas Hall",
        "Amelia Lewis", "Henry Walker", "Harper Young", "Elijah King", "Evelyn Wright", "Mateo Scott",
        "Camila Green", "Sebastian Adams", "Luna Baker", "Daniel Nelson", "Sofia Hill", "Leo Mitchell"
    ];

    private static readonly string[] Clinicians =
    [
        "Ava Chen", "James Monroe", "Sarah Lin", "Daniel Ward"
    ];

    private static readonly string[] Services =
    [
        "Initial assessment", "Diagnostic evaluation", "Individual therapy",
        "Medication follow-up", "Family therapy", "Care coordination"
    ];

    private static readonly AppointmentStatus[] AppointmentStatuses =
    [
        AppointmentStatus.Completed, AppointmentStatus.Completed, AppointmentStatus.Completed, AppointmentStatus.Completed,
        AppointmentStatus.InSession, AppointmentStatus.InSession,
        AppointmentStatus.CheckedIn, AppointmentStatus.CheckedIn,
        AppointmentStatus.Confirmed, AppointmentStatus.Confirmed, AppointmentStatus.Confirmed, AppointmentStatus.Confirmed,
        AppointmentStatus.Confirmed, AppointmentStatus.Confirmed, AppointmentStatus.Confirmed, AppointmentStatus.Confirmed,
        AppointmentStatus.Confirmed, AppointmentStatus.Confirmed,
        AppointmentStatus.Scheduled, AppointmentStatus.Scheduled, AppointmentStatus.Scheduled,
        AppointmentStatus.Scheduled, AppointmentStatus.Scheduled, AppointmentStatus.Scheduled
    ];

    private static readonly (string Number, string Payer, decimal Amount, string RiskReason)[] ClaimSeeds =
    [
        ("CLM-742198", "Blue Cross Blue Shield", 6380m, "Authorization required"),
        ("CLM-741552", "Aetna", 4210m, "Coding mismatch"),
        ("CLM-741091", "UnitedHealthcare", 3750m, "Timely filing risk"),
        ("CLM-740887", "Cigna", 3120m, "Medical necessity documentation"),
        ("CLM-740673", "Humana", 2860m, "Eligibility conflict"),
        ("CLM-740412", "Blue Cross Blue Shield", 2380m, "Payer rule validation"),
        ("CLM-740103", "Aetna", 7250m, "Authorization expired"),
        ("CLM-739944", "UnitedHealthcare", 6980m, "Medical necessity review"),
        ("CLM-739801", "Cigna", 5640m, "Coding mismatch"),
        ("CLM-739677", "Humana", 4980m, "Timely filing deadline"),
        ("CLM-739522", "Blue Cross Blue Shield", 3750m, "Payer rule validation"),
        ("CLM-739408", "Aetna", 2980m, "Eligibility conflict")
    ];

    private static readonly (string Actor, string Action, string EntityType, string Summary)[] AuditSeeds =
    [
        ("Ava Chen", "Note signed", "ClinicalNote", "Maya Johnson's progress note was signed."),
        ("Revenue cycle", "Claim flagged", "Claim", "CLM-742198 entered the authorization risk queue."),
        ("Front desk", "Appointment checked in", "Appointment", "Ethan Brooks arrived for diagnostic evaluation."),
        ("Revenue cycle", "Claim updated", "Claim", "CLM-741552 coding validation was reviewed."),
        ("Sarah Lin", "Note moved to review", "ClinicalNote", "A draft was submitted for clinical review."),
        ("Front desk", "Appointment confirmed", "Appointment", "Noah Carter confirmed the medication follow-up."),
        ("Outbox dispatcher", "Outbox event delivered", "Integration", "ClaimStatusChanged was published to the topic exchange."),
        ("Clinical operations", "Treatment plan linked", "ClinicalNote", "A current treatment plan was linked to the note."),
        ("Security", "Security review completed", "Workspace", "Role access review completed with no exceptions."),
        ("Revenue cycle", "Claim denied", "Claim", "Medical necessity documentation requires review."),
        ("Clinical operations", "Appointment completed", "Appointment", "An individual therapy session was completed."),
        ("Notification service", "Notification delivered", "Integration", "Scheduled patient reminders were delivered.")
    ];

    public static FictionalSeedDataset BuildDataset(DateTimeOffset now)
    {
        var dayStart = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var appointments = Patients.Select((patient, index) =>
        {
            var appointment = new Appointment
            {
                PatientDisplayName = patient,
                Clinician = Clinicians[index % Clinicians.Length],
                Service = Services[index % Services.Length],
                StartsAt = dayStart.AddHours(8 + index / 3).AddMinutes((index % 3) * 20)
            };
            ApplyAppointmentStatus(appointment, AppointmentStatuses[index]);
            return appointment;
        }).ToArray();

        var unsignedDueOffsets = new[] { -1, -3, -8, -14, -22, -30, -48 };
        var notes = appointments.Select((appointment, index) =>
        {
            var note = new ClinicalNote
            {
                AppointmentId = appointment.Id,
                Clinician = appointment.Clinician,
                DueAt = index < 17
                    ? now.AddHours(-Math.Max(1, 24 - index))
                    : now.AddHours(unsignedDueOffsets[index - 17])
            };

            if (index < 17)
            {
                note.TransitionTo(NoteStatus.InReview, now);
                note.TransitionTo(NoteStatus.Signed, now);
            }
            else if (index < 20)
            {
                note.TransitionTo(NoteStatus.InReview, now);
            }

            return note;
        }).ToArray();

        var claims = ClaimSeeds.Select(seed =>
        {
            var claim = new Claim
            {
                Number = seed.Number,
                Payer = seed.Payer,
                Amount = seed.Amount,
                RiskReason = seed.RiskReason
            };
            claim.TransitionTo(ClaimStatus.NeedsReview, now);
            return claim;
        }).ToArray();

        var audit = AuditSeeds.Select((seed, index) => new AuditEntry
        {
            Actor = seed.Actor,
            Action = seed.Action,
            EntityType = seed.EntityType,
            EntityId = $"demo-{index + 1}",
            Summary = seed.Summary,
            OccurredAt = now.AddMinutes(index * -7)
        }).ToArray();

        return new FictionalSeedDataset(appointments, notes, claims, audit);
    }

    public static async Task EnsureSeededAsync(PracticeOpsDbContext db, CancellationToken cancellationToken)
    {
        await db.Database.EnsureCreatedAsync(cancellationToken);
        if (await db.Appointments.AnyAsync(cancellationToken)) return;

        var dataset = BuildDataset(DateTimeOffset.UtcNow);
        db.AddRange(dataset.Appointments);
        db.AddRange(dataset.Notes);
        db.AddRange(dataset.Claims);
        db.AddRange(dataset.Audit);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void ApplyAppointmentStatus(Appointment appointment, AppointmentStatus status)
    {
        switch (status)
        {
            case AppointmentStatus.Scheduled:
                return;
            case AppointmentStatus.Confirmed:
                appointment.TransitionTo(AppointmentStatus.Confirmed);
                return;
            case AppointmentStatus.CheckedIn:
                appointment.TransitionTo(AppointmentStatus.CheckedIn);
                return;
            case AppointmentStatus.InSession:
                appointment.TransitionTo(AppointmentStatus.CheckedIn);
                appointment.TransitionTo(AppointmentStatus.InSession);
                return;
            case AppointmentStatus.Completed:
                appointment.TransitionTo(AppointmentStatus.CheckedIn);
                appointment.TransitionTo(AppointmentStatus.InSession);
                appointment.TransitionTo(AppointmentStatus.Completed);
                return;
            case AppointmentStatus.Cancelled:
                appointment.TransitionTo(AppointmentStatus.Cancelled);
                return;
            default:
                throw new ArgumentOutOfRangeException(nameof(status), status, "Unsupported seed appointment status.");
        }
    }
}
