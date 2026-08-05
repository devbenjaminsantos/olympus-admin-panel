using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RunBase.Infrastructure.Persistence;

public sealed class RunBaseDbContextFactory : IDesignTimeDbContextFactory<RunBaseDbContext>
{
    private const string DefaultConnectionStringEnvironmentKey = "ConnectionStrings__DefaultConnection";

    public RunBaseDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(DefaultConnectionStringEnvironmentKey);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"{DefaultConnectionStringEnvironmentKey} must be configured to create migrations.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<RunBaseDbContext>();
        optionsBuilder.UseNpgsql(
            connectionString,
            npgsqlOptions => npgsqlOptions.EnableRetryOnFailure());

        return new RunBaseDbContext(optionsBuilder.Options);
    }
}
