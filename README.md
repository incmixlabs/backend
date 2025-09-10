# Incmix API Monorepo
# Accidental merge
# Recent Refactoring
-- added CODEQL
We've recently standardized the health check implementation across all microservices. Now all services use a shared utility for health checks, providing consistent behavior and reducing code duplication.

### Connecting to local DB

```
psql -h localhost -p 54321 -U postgres  -d incmix
or
psql postgresql://postgres:password@localhost:54321/incmix
```
### Migration Guide

If you're working on a service that hasn't been migrated yet, follow these steps to implement the standardized service startup and environment configuration:

#### 1. Service Startup Implementation

All services should use the `createService` utility from `@incmix-api/utils` for consistent startup behavior:

**Create `src/index.ts`:**
```typescript
import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "your-service-name",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needRBAC: true, // Set to true if your service needs RBAC
  needDb: true,   // Set to false if your service doesn't need database
  setupRoutes: (app) => {
    routes(app)
  },
})

const { app, startServer } = service

startServer()

export default app
```

**Key Configuration Options:**
- `name`: Service identifier (used for logging and KV store)
- `port`: Service port (from env config)
- `basePath`: API base path (usually `/api/service-name`)
- `needRBAC`: Enable RBAC middleware if needed
- `needDb`: Enable database middleware if needed
- `setupMiddleware`: Custom middleware setup function
- `setupRoutes`: Route setup function
- `onBeforeStart`: Optional pre-startup hook

#### 2. Environment Configuration Implementation

All services should use the `createEnvConfig` utility for standardized environment variable handling:

**Create `src/env-vars.ts`:**
```typescript
import { createEnvConfig, type YourServiceEnv } from "@incmix-api/utils/env-config"

// Use the new env-config system with dotenv-mono
// This will automatically merge:
// 1. Root .env file
// 2. Root .env.{NODE_ENV} file
// 3. Service-specific .env file (if exists)
// 4. Service-specific .env.{NODE_ENV} file (if exists)
export const envVars = createEnvConfig("your-service-name") as YourServiceEnv
export type Env = YourServiceEnv
```

**Environment File Priority (highest to lowest):**
1. Service-specific `.env.{NODE_ENV}` (e.g., `.env.dev`)
2. Service-specific `.env`
3. Backend root `.env.{NODE_ENV}`
4. Backend root `.env`
5. Monorepo root `.env.{NODE_ENV}`
6. Monorepo root `.env`

**Service-specific Environment Schema:**
If your service needs additional environment variables, extend the base schema in `shared/utils/src/env-config/index.ts`:

```typescript
// Add to serviceSchemas object
yourService: baseEnvSchema.extend({
  YOUR_CUSTOM_VAR: z.string(),
  YOUR_OPTIONAL_VAR: z.string().optional(),
  PORT: z.coerce.number().default(services.yourService.port),
}),
```

#### 3. Health Check Implementation

1. Read the [Health Check Migration Guide](./shared/utils/docs/health-check.md)
2. Use the automatic migration script:
   ```bash
   node scripts/refactor-health-check.js --service <service-name>
   ```
3. Test the new implementation

#### 4. Complete Migration Checklist

- [ ] Implement `src/env-vars.ts` with `createEnvConfig`
- [ ] Update `src/index.ts` to use `createService`
- [ ] Define service-specific environment schema if needed
- [ ] Update `src/types.ts` to use proper HonoApp types
- [ ] Implement health check using shared utility
- [ ] Update middleware setup to work with new service structure
- [ ] Update route setup to work with new service structure
- [ ] Test all functionality
- [ ] Update service documentation

### Benefits

- **Consistent Service Startup**: All services use the same `createService` utility with standardized middleware, RBAC, and database setup
- **Unified Environment Configuration**: Centralized env-config system with automatic file merging and validation
- **Consistent Health Check Behavior**: All services use shared health check utility with standardized endpoints
- **Reduced Code Duplication**: Shared utilities eliminate repetitive boilerplate code
- **Standardized Route Naming**: Consistent `/health-check` endpoints across all services
- **Type Safety**: Full TypeScript support with proper environment variable validation
- **Graceful Shutdown**: Built-in signal handling for clean service shutdown
- **Easier Maintenance**: Centralized configuration makes updates and debugging simpler

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

| Endpoint       | Service     |
| -------------- | ----------- |
| *location-api* |             |
| weather        | tomorrow.io |
| news           | serpapi.com |
| ip location    | radar.io    |
| *auth-api*     |             |
| google auth    | google.com  |
| session auth   | custom      |
| *email-api*    |             |
| email          | resend.com  |

## How to Run
1. Install Docker
2. Run ```docker compose up -d``` to start database containers
3. Copy all `.env.example` files to `.env` in each API directory:
   ```bash
   for d in api/*; do [ -d "$d" ] && [ -f "$d/.env.example" ] && cp "$d/.env.example" "$d/.env"; done
   ```
4. Update environment variables in the new `.env` files as needed.
5. If you have just cloned the repository, run ```pnpm build``` to build all dependencies
6. Run ```pnpm dev``` to start APIs

## Troubleshooting
1. Run the following command to remove the postgres container, delete its volume, and rebuild it:
  ```bash
  docker compose down -v --remove-orphans && docker compose up -d --build
  ```
2. Run the following command to delete all .env files
  ```bash
  find ./api/ -type f -name ".env" -delete
  ```

## Testing
1. supertest for testing PRS
2. artillery weekly for manual load testing
3. schemathesis daily for manual fuzzing testing
