namespace RunBase.Application.Security;

public sealed class SensitiveDataMasker : ISensitiveDataMasker
{
    public string MaskEmail(string email)
    {
        var parts = email.Split('@', 2);

        if (parts.Length != 2)
        {
            return "***";
        }

        var local = parts[0];
        var domain = parts[1];
        var visible = local.Length <= 2
            ? local[..1]
            : local[..2];

        return $"{visible}***@{domain}";
    }
}
