using RunBase.Domain.Users;

namespace RunBase.Infrastructure.Auth;

internal static class LegacySeedAdmin
{
    public static readonly Guid Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string NormalizedEmail = "ADMIN@RUNBASE.LOCAL";

    public static bool IsLegacySeed(User user)
    {
        return user.Id == Id &&
            string.Equals(user.Email, NormalizedEmail, StringComparison.OrdinalIgnoreCase);
    }
}
