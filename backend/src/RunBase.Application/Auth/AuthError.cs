namespace RunBase.Application.Auth;

public enum AuthError
{
    InitialSetupAlreadyCompleted,
    InvalidSetupKey,
    InvalidCredentials,
    InvalidRefreshToken,
    InactiveUser,
    UserNotFound
}
