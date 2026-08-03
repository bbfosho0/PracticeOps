using Microsoft.EntityFrameworkCore;
using PracticeOps.Api;
using Xunit;

namespace PracticeOps.Tests;

public sealed class DemoResetServiceTests
{
    [Fact]
    public async Task Reset_replaces_existing_records_with_the_deterministic_baseline()
    {
        var options = new DbContextOptionsBuilder<PracticeOpsDbContext>()
            .UseInMemoryDatabase($"practiceops-reset-{Guid.NewGuid()}")
            .Options;
        await using var db = new PracticeOpsDbContext(options);
        var oldAppointment = new Appointment
        {
            PatientDisplayName = "Old fictional record",
            Clinician = "Old clinician",
            Service = "Old service",
            StartsAt = DateTimeOffset.UtcNow
        };
        db.Appointments.Add(oldAppointment);
        db.OutboxMessages.Add(new OutboxMessage { EventType = "OldEvent", Payload = "{}" });
        await db.SaveChangesAsync();

        var snapshot = await DemoResetService.ResetAsync(
            db,
            new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero),
            CancellationToken.None);

        Assert.False(await db.Appointments.AnyAsync(x => x.Id == oldAppointment.Id));
        Assert.Equal(24, await db.Appointments.CountAsync());
        Assert.Equal(24, await db.ClinicalNotes.CountAsync());
        Assert.Equal(12, await db.Claims.CountAsync());
        Assert.Equal(12, await db.AuditEntries.CountAsync());
        Assert.Equal(0, await db.OutboxMessages.CountAsync());
        Assert.Equal("schedule", snapshot.Scenario.CurrentWorkspace);
        Assert.Equal(24, snapshot.Metrics.AppointmentsToday);
    }
}
