using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using RunBase.Application.Auth;
using RunBase.Domain.Users;

namespace RunBase.Application.Tests.Api;

public sealed class ApiIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(allowIntegerValues: false) }
    };

    [Fact]
    public async Task Health_ReturnsHealthyStatusAndSecurityHeaders()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
        Assert.True(response.Headers.Contains("Permissions-Policy"));
    }

    [Fact]
    public async Task Login_WithSeedAdmin_ReturnsTokenPairAndAdminProfile()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var token = await LoginAsync(client);

        Assert.False(string.IsNullOrWhiteSpace(token.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(token.RefreshToken));
        Assert.Equal("admin@runbase.local", token.User.Email);
        Assert.Equal(UserRole.Admin, token.User.Role);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UsersEndpoint_WithSupportRole_ReturnsForbidden()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var adminToken = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken.AccessToken);
        var supportEmail = $"support-{Guid.NewGuid():N}@runbase.local";
        const string supportPassword = "Support123!";
        var createResponse = await client.PostAsJsonAsync(
            "/api/users",
            new
            {
                name = "RunBase Support",
                email = supportEmail,
                password = supportPassword,
                role = "Support",
                status = "Active"
            });
        createResponse.EnsureSuccessStatusCode();

        client.DefaultRequestHeaders.Authorization = null;
        var supportToken = await LoginAsync(client, supportEmail, supportPassword);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supportToken.AccessToken);

        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithInvalidPayload_ReturnsBadRequest()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                email = "not-an-email",
                password = "short"
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SensitiveClientDataEndpoint_AlwaysDeniesAndEscalatesRepeatedAttempts()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        var clientId = Guid.NewGuid();

        var firstResponse = await client.GetAsync($"/api/clients/{clientId}/sensitive");
        var firstBody = await firstResponse.Content.ReadAsStringAsync();
        var secondResponse = await client.GetAsync($"/api/clients/{clientId}/sensitive");
        var secondBody = await secondResponse.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Forbidden, firstResponse.StatusCode);
        Assert.Contains("Denied", firstBody, StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Forbidden, secondResponse.StatusCode);
        Assert.Contains("Blocked", secondBody, StringComparison.Ordinal);
    }

    private static WebApplicationFactory<Program> CreateFactory()
    {
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("environment", "Development");
            });
    }

    private static async Task<AuthTokenResponse> LoginAsync(
        HttpClient client,
        string email = "admin@runbase.local",
        string password = "Admin123!")
    {
        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new
            {
                email,
                password
            });

        response.EnsureSuccessStatusCode();

        var token = await response.Content.ReadFromJsonAsync<AuthTokenResponse>(JsonOptions);

        Assert.NotNull(token);

        return token;
    }
}
