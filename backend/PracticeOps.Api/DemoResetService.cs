using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace PracticeOps.Api;

public static class DemoResetService
{
    public static async Task<DashboardSnapshot> ResetAsync(
        PracticeOpsDbContext db,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        IDbContextTransaction? transaction = null;
        if (db.Database.IsRelational())
            transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            db.OutboxMessages.RemoveRange(await db.OutboxMessages.ToListAsync(cancellationToken));
            db.AuditEntries.RemoveRange(await db.AuditEntries.ToListAsync(cancellationToken));
            db.Claims.RemoveRange(await db.Claims.ToListAsync(cancellationToken));
            db.ClinicalNotes.RemoveRange(await db.ClinicalNotes.ToListAsync(cancellationToken));
            db.Appointments.RemoveRange(await db.Appointments.ToListAsync(cancellationToken));
            await db.SaveChangesAsync(cancellationToken);

            var dataset = FictionalSeed.BuildDataset(now);
            db.Appointments.AddRange(dataset.Appointments);
            db.ClinicalNotes.AddRange(dataset.Notes);
            db.Claims.AddRange(dataset.Claims);
            db.AuditEntries.AddRange(dataset.Audit);
            await db.SaveChangesAsync(cancellationToken);

            var snapshot = await DashboardSnapshotBuilder.BuildAsync(db, cancellationToken, now);
            if (transaction is not null)
                await transaction.CommitAsync(cancellationToken);
            return snapshot;
        }
        catch
        {
            if (transaction is not null)
                await transaction.RollbackAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (transaction is not null)
                await transaction.DisposeAsync();
        }
    }
}
