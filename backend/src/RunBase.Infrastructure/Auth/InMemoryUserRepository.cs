using System.Collections.Concurrent;
using RunBase.Application.Auth;
using RunBase.Domain.Users;

namespace RunBase.Infrastructure.Auth;

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<Guid, User> _users = new();
    private readonly object _initialSetupLock = new();

    public Task<bool> IsInitialSetupRequiredAsync(
        CancellationToken cancellationToken = default)
    {
        var setupRequired = _users.IsEmpty || _users.Values.Any(LegacySeedAdmin.IsLegacySeed);

        return Task.FromResult(setupRequired);
    }

    public Task<bool> TryCreateInitialAdminAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        lock (_initialSetupLock)
        {
            var existingUsers = _users.Values.ToList();
            var legacySeed = existingUsers.FirstOrDefault(LegacySeedAdmin.IsLegacySeed);

            if (existingUsers.Count != 0 && legacySeed is null)
            {
                return Task.FromResult(false);
            }

            if (legacySeed is not null)
            {
                _users.TryRemove(legacySeed.Id, out _);
            }

            _users[user.Id] = user;

            return Task.FromResult(true);
        }
    }

    public Task<IReadOnlyList<User>> ListAsync(
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<User>>(_users.Values.ToList());
    }

    public Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var user = _users.Values.FirstOrDefault(user =>
            string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(user);
    }

    public Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _users.TryGetValue(id, out var user);

        return Task.FromResult(user);
    }

    public Task<bool> EmailExistsAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default)
    {
        var exists = _users.Values.Any(user =>
            user.Id != exceptUserId &&
            string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }

    public Task SaveAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        _users[user.Id] = user;

        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        _users.TryRemove(user.Id, out _);

        return Task.CompletedTask;
    }
}
