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

public static class FictionalSeed
{
    public static async Task EnsureSeededAsync(PracticeOpsDbContext db, CancellationToken cancellationToken)
    {
        await db.Database.EnsureCreatedAsync(cancellationToken);
        if (await db.Appointments.AnyAsync(cancellationToken)) return;

        var now = DateTimeOffset.UtcNow;
        var appointments = new[]
        {
            new Appointment { PatientDisplayName = "Maya Johnson", Clinician = "Dr. Chen", Service = "Initial assessment", StartsAt = now.Date.AddHours(14) },
            new Appointment { PatientDisplayName = "Ethan Brooks", Clinician = "A. Rivera, LCSW", Service = "Therapy session", StartsAt = now.Date.AddHours(15.5) },
            new Appointment { PatientDisplayName = "Sophia Lee", Clinician = "Dr. Patel", Service = "Medication follow-up", StartsAt = now.Date.AddHours(18) },
            new Appointment { PatientDisplayName = "Noah Carter", Clinician = "A. Rivera, LCSW", Service = "Therapy session", StartsAt = now.Date.AddHours(20.5) }
        };
        appointments[0].TransitionTo(AppointmentStatus.Confirmed);
        appointments[1].TransitionTo(AppointmentStatus.Confirmed);
        appointments[1].TransitionTo(AppointmentStatus.CheckedIn);

        var notes = appointments.Select((a, index) => new ClinicalNote
        {
            AppointmentId = a.Id,
            Clinician = a.Clinician,
            DueAt = a.StartsAt.AddHours(index == 0 ? 24 : 48)
        }).ToArray();
        notes[0].TransitionTo(NoteStatus.InReview, now);

        var claims = new[]
        {
            new Claim { Number = "CLM-1048", Payer = "Aetna", Amount = 2480m, RiskReason = "Missing authorization" },
            new Claim { Number = "CLM-1052", Payer = "Cigna", Amount = 1190m, RiskReason = "Coding mismatch" },
            new Claim { Number = "CLM-1061", Payer = "UnitedHealthcare", Amount = 3620m, RiskReason = "Timely filing risk" }
        };
        foreach (var claim in claims) claim.TransitionTo(ClaimStatus.NeedsReview, now);

        db.AddRange(appointments);
        db.AddRange(notes);
        db.AddRange(claims);
        db.AuditEntries.Add(new AuditEntry { Actor = "System", Action = "Seeded", EntityType = "Workspace", EntityId = "demo", Summary = "Loaded fictional demonstration data." });
        await db.SaveChangesAsync(cancellationToken);
    }
}
