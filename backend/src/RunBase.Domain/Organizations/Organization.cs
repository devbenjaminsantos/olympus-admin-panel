namespace RunBase.Domain.Organizations;

public sealed class Organization
{
    public const int MaxNameLength = 120;
    public const int MaxSlugLength = 80;

    public Organization(
        Guid id,
        string name,
        string slug,
        OrganizationStatus status,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        Id = id;
        Name = NormalizeName(name);
        Slug = NormalizeSlug(slug);
        Status = status;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public Guid Id { get; }

    public string Name { get; private set; }

    public string Slug { get; private set; }

    public OrganizationStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public bool CanOperate => Status == OrganizationStatus.Active;

    public void Update(
        string name,
        string slug,
        OrganizationStatus status,
        DateTimeOffset updatedAt)
    {
        Name = NormalizeName(name);
        Slug = NormalizeSlug(slug);
        Status = status;
        UpdatedAt = updatedAt;
    }

    private static string NormalizeName(string name)
    {
        var normalizedName = name?.Trim() ?? string.Empty;

        if (normalizedName.Length == 0 || normalizedName.Length > MaxNameLength)
        {
            throw new ArgumentException(
                $"Organization name must contain between 1 and {MaxNameLength} characters.",
                nameof(name));
        }

        return normalizedName;
    }

    private static string NormalizeSlug(string slug)
    {
        var normalizedSlug = slug?.Trim().ToLowerInvariant() ?? string.Empty;

        if (normalizedSlug.Length == 0 || normalizedSlug.Length > MaxSlugLength)
        {
            throw new ArgumentException(
                $"Organization slug must contain between 1 and {MaxSlugLength} characters.",
                nameof(slug));
        }

        if (!IsValidSlug(normalizedSlug))
        {
            throw new ArgumentException(
                "Organization slug must use lowercase letters, numbers and single hyphens.",
                nameof(slug));
        }

        return normalizedSlug;
    }

    private static bool IsValidSlug(string slug)
    {
        if (slug[0] == '-' || slug[^1] == '-')
        {
            return false;
        }

        var previousWasHyphen = false;

        foreach (var character in slug)
        {
            var isHyphen = character == '-';
            var isAllowed = character is >= 'a' and <= 'z' or >= '0' and <= '9' || isHyphen;

            if (!isAllowed || isHyphen && previousWasHyphen)
            {
                return false;
            }

            previousWasHyphen = isHyphen;
        }

        return true;
    }
}
