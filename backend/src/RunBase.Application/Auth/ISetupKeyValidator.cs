namespace RunBase.Application.Auth;

public interface ISetupKeyValidator
{
    bool IsValid(string setupKey);
}
