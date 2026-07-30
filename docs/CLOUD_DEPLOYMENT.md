# RunBase Cloud Deployment

This document tracks the current cloud deployment direction after moving away from the original Azure-only plan.

## Target Architecture

```text
Frontend: Vercel
API: Containerized ASP.NET Core Web API
Database: AWS RDS for SQL Server
CI/CD: GitHub Actions
```

## Database

Current database provider:

```text
AWS RDS for SQL Server
```

Expected database name:

```text
runbase_db
```

Required connection string shape:

```text
ConnectionStrings__DefaultConnection=Server=tcp:<rds-endpoint>,1433;Initial Catalog=runbase_db;Persist Security Info=False;User ID=<user>;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;
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
- Network: allow outbound access to RDS SQL Server on port `1433`
- RDS security group: allow inbound `1433` from the API service security group

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

## Security Notes

- Rotate any database password that was exposed in terminal output, chat, screenshots, or logs.
- Keep RDS public access temporary while validating locally.
- Prefer allowing database traffic from the API security group instead of broad public IP ranges.
- Do not expose Scalar/OpenAPI in production unless intentionally enabled behind access control.
