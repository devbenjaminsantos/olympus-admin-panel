using System.Data;
using Microsoft.EntityFrameworkCore;
using RunBase.Application.Auth;
using RunBase.Domain.Users;
using RunBase.Infrastructure.Persistence;

namespace RunBase.Infrastructure.Auth;

public sealed class EfUserRepository : IUserRepository
{
    private readonly RunBaseDbContext _dbContext;

    public EfUserRepository(RunBaseDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsInitialSetupRequiredAsync(
        CancellationToken cancellationToken = default)
    {
        var hasUsers = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(cancellationToken);
        var hasLegacySeed = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(
                user => user.Id == LegacySeedAdmin.Id &&
                    user.Email.ToUpper() == LegacySeedAdmin.NormalizedEmail,
                cancellationToken);

        return !hasUsers || hasLegacySeed;
    }

    public async Task<bool> TryCreateInitialAdminAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            _dbContext.ChangeTracker.Clear();
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);
            var hasUsers = await _dbContext.Users.AnyAsync(cancellationToken);
            var legacySeed = await _dbContext.Users.FirstOrDefaultAsync(
                existingUser => existingUser.Id == LegacySeedAdmin.Id &&
                    existingUser.Email.ToUpper() == LegacySeedAdmin.NormalizedEmail,
                cancellationToken);

            if (hasUsers && legacySeed is null)
            {
                return false;
            }

            if (legacySeed is not null)
            {
                _dbContext.Users.Remove(legacySeed);
            }

            await _dbContext.Users.AddAsync(user, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return true;
        });
    }

    public async Task<IReadOnlyList<User>> ListAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);

        return await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Email.ToUpper() == normalizedEmail,
            cancellationToken);
    }

    public async Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(
            user => user.Id == id,
            cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);

        return await _dbContext.Users.AnyAsync(
            user =>
                (!exceptUserId.HasValue || user.Id != exceptUserId.Value) &&
                user.Email.ToUpper() == normalizedEmail,
            cancellationToken);
    }

    public async Task SaveAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var isTracked = _dbContext.ChangeTracker
            .Entries<User>()
            .Any(entry => entry.Entity.Id == user.Id);

        if (!isTracked)
        {
            var exists = await _dbContext.Users.AnyAsync(
                existingUser => existingUser.Id == user.Id,
                cancellationToken);

            if (exists)
            {
                _dbContext.Users.Update(user);
            }
            else
            {
                await _dbContext.Users.AddAsync(user, cancellationToken);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Remove(user);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }
}
