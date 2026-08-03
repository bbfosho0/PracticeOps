using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PracticeOps.Api;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("PracticeOps")
    ?? "Host=localhost;Port=5432;Database=practiceops;Username=practiceops;Password=practiceops";

builder.Services.AddDbContext<PracticeOpsDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddProblemDetails();
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddDbContextCheck<PracticeOpsDbContext>(tags: ["ready"]);
builder.Services.AddHostedService<OutboxDispatcher>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));

var app = builder.Build();
app.UseExceptionHandler(handler => handler.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, title) = exception switch
    {
        KeyNotFoundException => (StatusCodes.Status404NotFound, "Record not found"),
        InvalidOperationException => (StatusCodes.Status409Conflict, "Invalid workflow transition"),
        _ => (StatusCodes.Status500InternalServerError, "Unexpected server error")
    };
    var detail = status == StatusCodes.Status500InternalServerError
        ? "The operation could not be completed."
        : exception?.Message;
    await Results.Problem(statusCode: status, title: title, detail: detail).ExecuteAsync(context);
}));
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") });

app.MapGet("/api/dashboard", async (PracticeOpsDbContext db, CancellationToken ct) =>
    Results.Ok(await DashboardSnapshotBuilder.BuildAsync(db, ct)))
    .WithName("GetDashboard")
    .WithOpenApi();

app.MapPost("/api/demo/reset", async (PracticeOpsDbContext db, CancellationToken ct) =>
    Results.Ok(await DemoResetService.ResetAsync(db, DateTimeOffset.UtcNow, ct)))
    .WithName("ResetPortfolioDemo")
    .WithOpenApi();

app.MapPost("/api/appointments/{id:guid}/status", async (Guid id, StatusRequest<AppointmentStatus> request, PracticeOpsDbContext db, CancellationToken ct) =>
{
    var entity = await db.Appointments.FindAsync([id], ct) ?? throw new KeyNotFoundException("Appointment not found.");
    entity.TransitionTo(request.Status);
    AddAuditAndEvent(db, request.Actor, "AppointmentStatusChanged", "Appointment", id, $"Appointment moved to {request.Status}.", new { id, request.Status });
    await db.SaveChangesAsync(ct);
    return Results.Ok(entity);
}).WithName("UpdateAppointmentStatus").WithOpenApi();

app.MapPost("/api/notes/{id:guid}/status", async (Guid id, StatusRequest<NoteStatus> request, PracticeOpsDbContext db, CancellationToken ct) =>
{
    var entity = await db.ClinicalNotes.FindAsync([id], ct) ?? throw new KeyNotFoundException("Clinical note not found.");
    entity.TransitionTo(request.Status, DateTimeOffset.UtcNow);
    AddAuditAndEvent(db, request.Actor, "ClinicalNoteStatusChanged", "ClinicalNote", id, $"Clinical note moved to {request.Status}.", new { id, request.Status });
    await db.SaveChangesAsync(ct);
    return Results.Ok(entity);
}).WithName("UpdateClinicalNoteStatus").WithOpenApi();

app.MapPost("/api/claims/{id:guid}/status", async (Guid id, StatusRequest<ClaimStatus> request, PracticeOpsDbContext db, CancellationToken ct) =>
{
    var entity = await db.Claims.FindAsync([id], ct) ?? throw new KeyNotFoundException("Claim not found.");
    entity.TransitionTo(request.Status, DateTimeOffset.UtcNow);
    AddAuditAndEvent(db, request.Actor, "ClaimStatusChanged", "Claim", id, $"Claim moved to {request.Status}.", new { id, request.Status });
    await db.SaveChangesAsync(ct);
    return Results.Ok(entity);
}).WithName("UpdateClaimStatus").WithOpenApi();

await using (var scope = app.Services.CreateAsyncScope())
{
    await FictionalSeed.EnsureSeededAsync(scope.ServiceProvider.GetRequiredService<PracticeOpsDbContext>(), CancellationToken.None);
}

app.Run();

static void AddAuditAndEvent(PracticeOpsDbContext db, string actor, string eventType, string entityType, Guid id, string summary, object payload)
{
    db.AuditEntries.Add(new AuditEntry { Actor = actor, Action = eventType, EntityType = entityType, EntityId = id.ToString(), Summary = summary });
    db.OutboxMessages.Add(new OutboxMessage { EventType = eventType, Payload = JsonSerializer.Serialize(payload) });
}

public sealed record StatusRequest<TStatus>(TStatus Status, string Actor);
public partial class Program;
