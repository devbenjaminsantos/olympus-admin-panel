namespace RunBase.Infrastructure.Auth;

public sealed class BootstrapOptions
{
    public const string SectionName = "Auth:Bootstrap";

    public string SetupKey { get; init; } = string.Empty;
}
