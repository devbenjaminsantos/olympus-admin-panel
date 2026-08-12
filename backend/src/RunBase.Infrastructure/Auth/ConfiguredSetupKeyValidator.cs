using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using RunBase.Application.Auth;

namespace RunBase.Infrastructure.Auth;

public sealed class ConfiguredSetupKeyValidator : ISetupKeyValidator
{
    private readonly byte[] _expectedKeyHash;

    public ConfiguredSetupKeyValidator(IOptions<BootstrapOptions> options)
    {
        _expectedKeyHash = Hash(options.Value.SetupKey);
    }

    public bool IsValid(string setupKey)
    {
        var providedKeyHash = Hash(setupKey);

        return CryptographicOperations.FixedTimeEquals(_expectedKeyHash, providedKeyHash);
    }

    private static byte[] Hash(string value)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(value));
    }
}
