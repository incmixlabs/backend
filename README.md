# Incmix API Monorepo

## Recent Refactoring

We've recently standardized the health check implementation across all microservices. Now all services use a shared utility for health checks, providing consistent behavior and reducing code duplication.

### Connecting to local DB

```
psql -h localhost -p 54321 -U postgres  -d incmix
or
psql postgresql://postgres:password@localhost:54321/incmix
```
### Migration Guide

If you're working on a service that hasn't been migrated yet:

1. Read the [Health Check Migration Guide](./docs/health-check-migration.md)
2. Use the automatic migration script:
   ```bash
   node scripts/refactor-health-check.js --service <service-name>
   ```
3. Test the new implementation

### Benefits

- Consistent health check behavior across all services
- Reduced code duplication
- Standardized route naming (`/health-check`)
- Easier maintenance

## The Tech stack is

### Client

- [x] pnpm
- [x] react
- [x] nextjs
- [x] zustand
- [x] tailwind
- [x] radix-ui and shadcn

### Server

- [x] pnpm
- [x] hono (Nodejs)
- [x] Custom session-based auth (see api/auth/README.md)
- [x] backend postgres (postgres)
- [x] Deployment (Flyio)

*Backend APIs*

| Endpoint       | Service      |
| -------------- | ------------ |
| *location-api* |              |
| weather        | tomorrow.io  |
| news           | serpapi.com  |
| ip location    | radar.io     |
| *auth-api*     |              |
| google auth    | google.com   |
| session auth   | custom       |
| *email-api*    |              |
| email          | sendgrid.com |

## How to Run
1. Install Docker
2. Run ```docker compose up -d``` to start database containers
3. Update environment variable.
4. Run ```docker exec -it incmix-postgres-1 /bin/bash -c "cd /app/db && pnpm migrate"``` to initialize db
5. Run ```pnpm dev``` to start APIs
