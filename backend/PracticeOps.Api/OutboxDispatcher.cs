using System.Text;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;

namespace PracticeOps.Api;

public sealed class OutboxDispatcher(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<OutboxDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchBatchAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Outbox dispatch failed; messages remain pending for retry.");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task DispatchBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PracticeOpsDbContext>();
        var messages = await db.OutboxMessages
            .Where(x => x.ProcessedAt == null)
            .OrderBy(x => x.OccurredAt)
            .Take(25)
            .ToListAsync(cancellationToken);
        if (messages.Count == 0) return;

        var factory = new ConnectionFactory
        {
            HostName = configuration["RabbitMq:Host"] ?? "localhost",
            UserName = configuration["RabbitMq:Username"] ?? "guest",
            Password = configuration["RabbitMq:Password"] ?? "guest"
        };

        await using var connection = await factory.CreateConnectionAsync(cancellationToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);
        await channel.ExchangeDeclareAsync("practiceops.events", ExchangeType.Topic, durable: true, autoDelete: false, cancellationToken: cancellationToken);

        foreach (var message in messages)
        {
            var properties = new BasicProperties { Persistent = true, ContentType = "application/json", MessageId = message.Id.ToString(), Type = message.EventType };
            await channel.BasicPublishAsync("practiceops.events", message.EventType, mandatory: true, properties, Encoding.UTF8.GetBytes(message.Payload), cancellationToken);
            message.ProcessedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
