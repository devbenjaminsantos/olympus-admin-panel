using RunBase.Application.Security;

namespace RunBase.Application.Tests.Security;

public sealed class SensitiveDataMaskerTests
{
    [Fact]
    public void MaskEmail_MasksLocalPart()
    {
        var masker = new SensitiveDataMasker();

        var result = masker.MaskEmail("client@example.com");

        Assert.Equal("cl***@example.com", result);
    }
}
