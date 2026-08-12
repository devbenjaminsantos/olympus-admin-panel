using RunBase.Domain.Users;

namespace RunBase.Application.Auth;

public interface IUserRepository
{
    Task<bool> IsInitialSetupRequiredAsync(
        CancellationToken cancellationToken = default);

    Task<bool> TryCreateInitialAdminAsync(
        User user,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<User>> ListAsync(
        CancellationToken cancellationToken = default);

    Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(
        string email,
        Guid? exceptUserId = null,
        CancellationToken cancellationToken = default);

    Task SaveAsync(
        User user,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        User user,
        CancellationToken cancellationToken = default);
}
