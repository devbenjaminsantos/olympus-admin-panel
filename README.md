# RunBase

RunBase is an internal admin panel and subscription management system for managing clients, plans, orders, and access control in recurring operations.

The current direction is a modern product foundation with:

- Next.js, React, and TypeScript for the frontend
- ASP.NET Core Web API and C# for the backend
- Neon Postgres for persistence
- JWT, refresh tokens, and role-based access control
- Containerized API deployment and Vercel for frontend hosting
- GitHub Actions for CI/CD

The original Olympus Admin prototype was removed after the RunBase foundation became the active product base.

For the Portuguese product narrative, version history, and planning notes, see [docs/PROJETO_E_PLANEJAMENTO.md](./docs/PROJETO_E_PLANEJAMENTO.md).

## Current Status

The new RunBase foundation currently includes:

- ASP.NET Core Web API under `backend/`
- Layered solution with `Api`, `Application`, `Domain`, and `Infrastructure`
- Interactive API documentation with Scalar
- Health endpoint at `/health`
- Basic JWT login at `/api/auth/login`
- Refresh token rotation at `/api/auth/refresh`
- Protected current-user endpoint at `/api/auth/me`
- Initial xUnit test project
- Next.js frontend under `frontend/`

## Repository Structure

```text
RunBase/
  backend/
    RunBase.slnx
    src/
      RunBase.Api/
      RunBase.Application/
      RunBase.Domain/
      RunBase.Infrastructure/
    tests/
      RunBase.Application.Tests/
  frontend/
    app/
    components/
    lib/
    public/
  docs/
    PROJETO_E_PLANEJAMENTO.md
    RUNBASE_ROADMAP.md
    SECURITY_PERSISTENCE.md
    TESTING.md
```

## Backend Setup

From the repository root:

```bash
cd backend
dotnet restore RunBase.slnx
dotnet build RunBase.slnx
dotnet test RunBase.slnx --no-build
dotnet run --project src/RunBase.Api/RunBase.Api.csproj --launch-profile http
```

Backend container build:

```bash
cd backend
docker build -t runbase-api:local .
docker run --rm -p 8080:8080 runbase-api:local
```

Local endpoints:

- API health: `http://localhost:5140/health`
- Auth login: `POST http://localhost:5140/api/auth/login`
- Auth refresh: `POST http://localhost:5140/api/auth/refresh`
- Current user: `GET http://localhost:5140/api/auth/me`
- Scalar API reference: `http://localhost:5140/scalar/v1`
- OpenAPI document: `http://localhost:5140/openapi/v1.json`

Required production environment values:

```text
ConnectionStrings__DefaultConnection
Auth__Jwt__SigningKey
Auth__SeedAdmin__Password
Security__SensitiveData__Key
```

## Security Follow-ups

The current frontend stores the authenticated session in `localStorage`. This is a known security limitation: the UI does not render unsafe HTML and the API avoids exposing tokens in URLs, but an XSS vulnerability could still expose the session.

Planned improvements:

- Move refresh token handling to a `HttpOnly`, `Secure`, `SameSite` cookie.
- Keep only short-lived access tokens in frontend memory where possible.
- Store refresh tokens as hashes in the database instead of storing raw token values.
- Revalidate the authentication flow after deployment and every HTTPS/CORS configuration change.

## Documentation

- [Product and planning notes in Portuguese](./docs/PROJETO_E_PLANEJAMENTO.md)
- [RunBase roadmap](./docs/RUNBASE_ROADMAP.md)
- [Cloud deployment guide](./docs/CLOUD_DEPLOYMENT.md)
- [Security persistence rules](./docs/SECURITY_PERSISTENCE.md)
- [Testing strategy](./docs/TESTING.md)

## Author

Built by **Benjamin Montenegro**.
