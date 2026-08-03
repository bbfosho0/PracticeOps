using Microsoft.EntityFrameworkCore;
using PracticeOps.Api;
using Xunit;

namespace PracticeOps.Tests;

public sealed class DashboardSnapshotTests
{
    [Fact]
    public async Task Build_reports_exact_outbox_totals_beyond_the_recent_event_window()
    {
        var options = new DbContextOptionsBuilder<PracticeOpsDbContext>()
            .UseInMemoryDatabase($"practiceops-dashboard-{Guid.NewGuid()}")
            .Options;
        await using var db = new PracticeOpsDbContext(options);
        var now = new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);
        var dataset = FictionalSeed.BuildDataset(now);
        db.Appointments.AddRange(dataset.Appointments);
        db.ClinicalNotes.AddRange(dataset.Notes);
        db.Claims.AddRange(dataset.Claims);
        db.AuditEntries.AddRange(dataset.Audit);

        for (var index = 0; index < 105; index++)
        {
            db.OutboxMessages.Add(new OutboxMessage
            {
                EventType = $"PortfolioEvent{index}",
                Payload = "{}",
                OccurredAt = now.AddMinutes(index),
                ProcessedAt = index < 52 ? now.AddMinutes(index).AddSeconds(1) : null
            });
        }
        await db.SaveChangesAsync();

        var snapshot = await DashboardSnapshotBuilder.BuildAsync(db, CancellationToken.None, now);

        Assert.Equal(105, snapshot.Outbox.TotalMessages);
        Assert.Equal(53, snapshot.Outbox.PendingMessages);
        Assert.Equal(52, snapshot.Outbox.DeliveredMessages);
        Assert.Equal("PortfolioEvent104", snapshot.Outbox.LatestEventType);
    }
}
