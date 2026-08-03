using Microsoft.EntityFrameworkCore;

namespace PracticeOps.Api;

public sealed record OutboxSummary(
    int TotalMessages,
    int PendingMessages,
    int DeliveredMessages,
    string? LatestEventType,
    DateTimeOffset? LatestOccurredAt,
    DateTimeOffset? LatestProcessedAt);

public sealed record DashboardSnapshot(
    DashboardMetrics Metrics,
    IReadOnlyList<Appointment> Appointments,
    IReadOnlyList<ClinicalNote> Notes,
    IReadOnlyList<Claim> Claims,
    IReadOnlyList<AuditEntry> Audit,
    PortfolioScenario Scenario,
    OutboxSummary Outbox);

public static class DashboardSnapshotBuilder
{
    public static async Task<DashboardSnapshot> BuildAsync(
        PracticeOpsDbContext db,
        CancellationToken cancellationToken,
        DateTimeOffset? referenceTime = null)
    {
        var now = referenceTime ?? DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);

        var appointments = await db.Appointments
            .AsNoTracking()
            .Where(item => item.StartsAt >= today && item.StartsAt < tomorrow)
            .OrderBy(item => item.StartsAt)
            .ToListAsync(cancellationToken);
        var notes = await db.ClinicalNotes
            .AsNoTracking()
            .OrderBy(item => item.DueAt)
            .ToListAsync(cancellationToken);
        var claims = await db.Claims
            .AsNoTracking()
            .OrderByDescending(item => item.Amount)
            .ToListAsync(cancellationToken);
        var audit = await db.AuditEntries
            .AsNoTracking()
            .OrderByDescending(item => item.OccurredAt)
            .Take(40)
            .ToListAsync(cancellationToken);
        var outboxMessages = await db.OutboxMessages
            .AsNoTracking()
            .OrderByDescending(item => item.OccurredAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var latest = outboxMessages.FirstOrDefault();
        var metrics = DashboardMetricsCalculator.Calculate(appointments, notes, claims);
        var scenario = PortfolioScenarioBuilder.Build(appointments, notes, claims);
        var outbox = new OutboxSummary(
            outboxMessages.Count,
            outboxMessages.Count(item => item.ProcessedAt is null),
            outboxMessages.Count(item => item.ProcessedAt is not null),
            latest?.EventType,
            latest?.OccurredAt,
            latest?.ProcessedAt);

        return new DashboardSnapshot(metrics, appointments, notes, claims, audit, scenario, outbox);
    }
}
