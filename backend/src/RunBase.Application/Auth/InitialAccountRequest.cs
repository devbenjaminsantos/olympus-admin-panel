using System.ComponentModel.DataAnnotations;

namespace RunBase.Application.Auth;

public sealed record InitialAccountRequest(
    [property: Required]
    [property: StringLength(120, MinimumLength = 2)]
    string Name,
    [property: Required]
    [property: EmailAddress]
    [property: StringLength(254)]
    string Email,
    [property: Required]
    [property: MinLength(12)]
    [property: StringLength(128)]
    string Password,
    [property: Required]
    [property: MinLength(16)]
    [property: StringLength(256)]
    string SetupKey);
