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

For local/prototype deployment, `Frontend__AllowedOrigins__0` should be the Vercel frontend URL once available.

## Suggested API Hosting Paths

Simplest managed container options:

```text
Render Web Service
Railway Service
Fly.io App
```

AWS-native option:

```text
ECR repository -> ECS Fargate service -> public load balancer -> /health check
```

For the first public API deployment, Render is the simplest option because it can build directly from the repository Dockerfile, supports environment variables, exposes a public HTTPS URL, and supports HTTP health checks.

Render manual settings for this monorepo:

```text
Runtime: Docker
Root Directory: backend
Dockerfile Path: ./Dockerfile
Docker Build Context Directory: .
Health Check Path: /health
```

The repository also includes `render.yaml` with the same service shape for Blueprint-based setup.

Railway is also a good prototype path. It supports environment variables and Dockerfile-based services, but the API must listen on the injected `PORT` environment variable.

Fly.io is more infrastructure-oriented. It is portable and Docker-friendly, but requires more CLI/configuration work than Render or Railway.

## Suggested AWS API Path

Recommended AWS path if keeping API inside AWS:

```text
ECR repository -> ECS Fargate service -> public load balancer -> /health check
```

Initial ECS notes:

- Container port: `8080`
- Health check path: `/health`
- CPU/memory: smallest development-friendly size
- Secrets: use ECS task environment variables or AWS Secrets Manager
- Network: allow outbound access to Neon Postgres on port `5432`

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
Frontend: npm ci, Next.js production build
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
