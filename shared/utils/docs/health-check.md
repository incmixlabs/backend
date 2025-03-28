# Health Check Utility

This document explains how to use the shared health check utility to implement consistent health check endpoints across all microservices.

## Overview

The health check utility provides a standardized way to:

1. Check required environment variables
2. Perform service-specific health checks (database, S3, etc.)
3. Return consistent health status responses
4. Configure OpenAPI documentation

## Installation

The utility is included in the `@incmix-api/utils` package, so no additional installation is needed.

## Basic Usage

Here's a simple example of how to use the health check utility:

```typescript
import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    // Add other required environment variables
  },
  
  // Set OpenAPI tags
  tags: ["Health Check"],
})

export default healthcheckRoutes
```

## Adding Custom Health Checks

You can add custom health checks for your service:

```typescript
import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    // Environment variables to check
  },
  
  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          // Simple query to check database connectivity
          await db.selectFrom("users").selectAll().limit(1).execute()
          return true
        } catch (error) {
          return false
        }
      },
    },
    {
      name: "Redis",
      check: async () => {
        try {
          // Check Redis connectivity
          await redis.ping()
          return true
        } catch (error) {
          return false
        }
      },
    },
  ],
  
  tags: ["Health Check"],
})

export default healthcheckRoutes
```

## Configuration Options

The `createHealthCheckRoute` function accepts a configuration object with the following options:

| Option | Type | Description |
|--------|------|-------------|
| `envVars` | `Record<string, string \| undefined>` | Environment variables to check. Each missing or undefined variable will cause the health check to return DOWN status. |
| `checks` | `Array<{ name: string, check: () => Promise<boolean> }>` | Custom health checks to perform. Each check should return a promise that resolves to a boolean (true = healthy). |
| `tags` | `string[]` | OpenAPI tags for documentation. Defaults to `["Health Check"]`. |
| `requireAuth` | `boolean` | Whether to require authentication for the health check endpoint. Defaults to `false`. |

## Response Format

The health check endpoint always returns a 200 HTTP status code with a JSON body containing:

```json
{
  "status": "UP", // or "DOWN" if any checks fail
  "reason": "Optional reason message if status is DOWN"
}
```

## Implementation Steps

To implement the health check in your service:

1. Create a new file at `src/routes/health-check/index.ts`
2. Import and use the `createHealthCheckRoute` function
3. Configure environment variables and service-specific checks
4. Make sure your `src/routes/index.ts` file routes to `/health-check`

## Migration from Existing Implementation

If you're migrating from an existing health check implementation:

1. Create a new implementation using the shared utility
2. Make sure it includes all the same checks as your existing implementation
3. Update the route export to use the new implementation
4. Update any tests to work with the new implementation

## Usage in Tests

When writing tests for your health check endpoint, you can expect the following:

- A 200 response status code always (even if health check fails)
- A JSON body with a `status` field ("UP" or "DOWN")
- A `reason` field that's present only when status is "DOWN"