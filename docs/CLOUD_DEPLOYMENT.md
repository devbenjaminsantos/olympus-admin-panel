# RunBase Cloud Deployment

This document tracks the current cloud deployment direction after moving away from the original Azure-only plan.

## Target Architecture

```text
Frontend: Vercel
API: Containerized ASP.NET Core Web API
Database: Neon Postgres
CI/CD: GitHub Actions
```

## Database

Current database provider:

```text
Neon Postgres
```

Required connection string shape:

```text
ConnectionStrings__DefaultConnection=Host=<neon-host>;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

Do not commit real passwords or full production connection strings.

## API Container

Build the API image from the backend folder:

```bash
cd backend
docker build -t runbase-api:local .
```

Run locally:

```bash
docker run --rm -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__DefaultConnection='<connection-string>' \
  -e Auth__Jwt__SigningKey='<strong-secret>' \
  -e Auth__SeedAdmin__Password='<strong-seed-password>' \
  -e Security__SensitiveData__Key='<base64-32-byte-key>' \
  runbase-api:local
```

Validate:

```bash
curl http://localhost:8080/health
```

## Required API Environment Variables

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection
Auth__Jwt__SigningKey
Auth__SeedAdmin__Password
Security__SensitiveData__Key
Frontend__AllowedOrigins__0
```

Set `Frontend__AllowedOrigins__0` to the exact Vercel frontend origin.

## API Hosting - Render

Render builds the API directly from the repository Dockerfile, provides the public HTTPS endpoint, stores environment variables, and monitors the `/health` endpoint.

Render manual settings for this monorepo:

```text
Runtime: Docker
Root Directory: backend
Dockerfile Path: ./Dockerfile
Docker Build Context Directory: .
Health Check Path: /health
```

The repository also includes `render.yaml` with the same service shape for Blueprint-based setup.

## Frontend

Frontend target:

```text
Vercel
```

Required frontend environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://<api-domain>
```

After the API is published, update the API CORS setting:

```text
Frontend__AllowedOrigins__0=https://<vercel-domain>
```

## GitHub Actions CI/CD

The workflow `.github/workflows/backend-ci.yml` runs on pushes and pull requests that change backend, frontend, Render config, or the workflow itself.

Pipeline checks:

```text
Backend: restore, build, xUnit tests
Frontend: npm ci, Vitest, Next.js production build, Playwright
API container: Docker image build from backend/Dockerfile
```

Production deploys are triggered only on pushes to `main`.

Required repository secrets:

```text
RENDER_DEPLOY_HOOK_URL
VERCEL_DEPLOY_HOOK_URL
```

If a deploy hook secret is not configured, the workflow keeps the checks green and skips that deploy target with an explicit log message.

## Security Notes

- Rotate any database password that was exposed in terminal output, chat, screenshots, or logs.
- Prefer pooled Neon connection strings for high-concurrency or serverless-style deployments.
- Do not expose Scalar/OpenAPI in production unless intentionally enabled behind access control.
