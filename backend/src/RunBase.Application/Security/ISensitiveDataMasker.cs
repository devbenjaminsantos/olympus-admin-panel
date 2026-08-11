namespace RunBase.Application.Security;

public interface ISensitiveDataMasker
{
    string MaskEmail(string email);
}
