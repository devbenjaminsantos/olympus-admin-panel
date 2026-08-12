using RunBase.Domain.Users;
using RunBase.Infrastructure.Auth;

namespace RunBase.Application.Tests.Auth;

public sealed class InMemoryUserRepositoryTests
{
    [Fact]
    public async Task InitialSetup_ReplacesLegacySeedWhenItIsTheOnlyUser()
    {
        var repository = new InMemoryUserRepository();
        var now = DateTimeOffset.UtcNow;
        var legacyAdmin = new User(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            "RunBase Admin",
            "admin@runbase.local",
            "legacy-password-hash",
            UserRole.Admin,
            UserStatus.Active,
            now,
            now);
        var replacementAdmin = new User(
            Guid.NewGuid(),
            "Account Owner",
            "owner@runbase.local",
            "replacement-password-hash",
            UserRole.Admin,
            UserStatus.Active,
            now,
            now);
        var existingManager = new User(
            Guid.NewGuid(),
            "Existing Manager",
            "manager@runbase.local",
            "manager-password-hash",
            UserRole.Manager,
            UserStatus.Active,
            now,
            now);
        await repository.SaveAsync(legacyAdmin);
        await repository.SaveAsync(existingManager);

        var setupRequired = await repository.IsInitialSetupRequiredAsync();
        var created = await repository.TryCreateInitialAdminAsync(replacementAdmin);
        var users = await repository.ListAsync();

        Assert.True(setupRequired);
        Assert.True(created);
        Assert.Equal(2, users.Count);
        Assert.Contains(users, user => user.Id == replacementAdmin.Id);
        Assert.Contains(users, user => user.Id == existingManager.Id);
        Assert.DoesNotContain(users, user => user.Id == legacyAdmin.Id);
    }

    [Fact]
    public async Task InitialSetup_WithRealUserAlreadyStored_IsClosed()
    {
        var repository = new InMemoryUserRepository();
        var now = DateTimeOffset.UtcNow;
        var existingAdmin = new User(
            Guid.NewGuid(),
            "Existing Admin",
            "existing-admin@runbase.local",
            "password-hash",
            UserRole.Admin,
            UserStatus.Active,
            now,
            now);
        await repository.SaveAsync(existingAdmin);

        var setupRequired = await repository.IsInitialSetupRequiredAsync();
        var created = await repository.TryCreateInitialAdminAsync(new User(
            Guid.NewGuid(),
            "Competing Admin",
            "competing-admin@runbase.local",
            "password-hash",
            UserRole.Admin,
            UserStatus.Active,
            now,
            now));

        Assert.False(setupRequired);
        Assert.False(created);
    }
}
