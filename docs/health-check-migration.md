# Health Check Migration Guide

This guide explains how to migrate your service's health check implementation to use the shared utility.

## Step 1: Update imports in index.ts

Replace the existing implementation with the shared utility:

```typescript
// Before
import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { healthCheck } from "./openapi"

// After
import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"
```

## Step 2: Replace implementation with shared utility

```typescript
// Before
const healthcheckRoutes = new OpenAPIHono<HonoApp>()
healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    // DB checks, env var checks, etc.
    // ...
    return c.json(...)
  } catch (error) {
    return c.json(...)
  }
})

// After
const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    // List all required env vars
    AUTH_URL: envVars.AUTH_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    // ...
  },
  
  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          // Your database check here
          return true
        } catch (error) {
          return false
        }
      },
    },
    // Add other checks as needed
  ],
  
  // Set OpenAPI tags
  tags: ["Health Check"],
  
  // Set auth requirement (if your service requires it)
  requireAuth: true,
})
```

## Step 3: Clean up unnecessary files

You can remove these files as they're no longer needed:
- `openapi.ts` (handled by the shared utility)
- `types.ts` (handled by the shared utility)

## Step 4: Update route path (if needed)

If you need to update your route path in `routes/index.ts`:

```typescript
// From
app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)

// To (standardized with hyphen)
app.route(`${BASE_PATH}/health-check`, healthcheckRoutes)
```

## Step 5: Test your implementation

Make sure to test the new health check endpoint to ensure it works correctly:

```bash
curl http://localhost:<port>/api/<service>/health-check
```

## Example Implementation

```typescript
import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    AUTH_URL: envVars.AUTH_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_URL: envVars.INTL_URL,
  },
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          await db.selectFrom("users").selectAll().limit(1).execute()
          return true
        } catch (error) {
          return false
        }
      },
    },
  ],
  tags: ["Health Check"],
  requireAuth: false,
})

export default healthcheckRoutes
```