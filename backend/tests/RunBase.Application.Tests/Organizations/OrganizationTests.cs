using RunBase.Domain.Organizations;

namespace RunBase.Application.Tests.Organizations;

public sealed class OrganizationTests
{
    [Fact]
    public void Constructor_NormalizesNameAndSlug()
    {
        var now = DateTimeOffset.UtcNow;

        var organization = new Organization(
            Guid.NewGuid(),
            "  Zeldris  ",
            "  ZELDRIS-TEAM  ",
            OrganizationStatus.Active,
            now,
            now);

        Assert.Equal("Zeldris", organization.Name);
        Assert.Equal("zeldris-team", organization.Slug);
        Assert.True(organization.CanOperate);
    }

    [Theory]
    [InlineData("")]
    [InlineData("-")]
    [InlineData("zeldris-")]
    [InlineData("zeldris--team")]
    [InlineData("zeldris_team")]
    [InlineData("zeldris team")]
    public void Constructor_RejectsInvalidSlug(string slug)
    {
        var now = DateTimeOffset.UtcNow;

        var exception = Assert.Throws<ArgumentException>(
            () => new Organization(
                Guid.NewGuid(),
                "Zeldris",
                slug,
                OrganizationStatus.Active,
                now,
                now));

        Assert.Equal("slug", exception.ParamName);
    }

    [Fact]
    public void Constructor_RejectsEmptyName()
    {
        var now = DateTimeOffset.UtcNow;

        var exception = Assert.Throws<ArgumentException>(
            () => new Organization(
                Guid.NewGuid(),
                "   ",
                "zeldris",
                OrganizationStatus.Active,
                now,
                now));

        Assert.Equal("name", exception.ParamName);
    }

    [Fact]
    public void Update_ChangesDetailsAndOperationalStatus()
    {
        var now = DateTimeOffset.UtcNow;
        var updatedAt = now.AddMinutes(1);
        var organization = new Organization(
            Guid.NewGuid(),
            "Zeldris",
            "zeldris",
            OrganizationStatus.Active,
            now,
            now);

        organization.Update(
            "Zeldris Group",
            "zeldris-group",
            OrganizationStatus.Suspended,
            updatedAt);

        Assert.Equal("Zeldris Group", organization.Name);
        Assert.Equal("zeldris-group", organization.Slug);
        Assert.Equal(OrganizationStatus.Suspended, organization.Status);
        Assert.Equal(updatedAt, organization.UpdatedAt);
        Assert.False(organization.CanOperate);
    }
}
