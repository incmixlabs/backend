import { OpenAPIHono } from "@hono/zod-openapi"
import { setupHealthCheck } from "@incmix-api/utils"
import { initDb } from "@incmix-api/utils/db-schema"
import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

// Initialize a database connection for health checks
// This is separate from the request-scoped database connection
const getHealthCheckDb = () => {
  try {
    return initDb(envVars.DATABASE_URL)
  } catch (error) {
    console.error("Failed to initialize health check database:", error)
    return null
  }
}

setupHealthCheck(healthcheckRoutes, {
  serviceName: "tasks-api",
  version: "1.0.0",
  checks: {
    database: async () => {
      try {
        const db = getHealthCheckDb()
        if (!db) {
          return false
        }
        // Simple query to check database connectivity
        await db.selectFrom("tasks").selectAll().limit(1).execute()
        return true
      } catch (_error) {
        return false
      }
    },
  },
})

export default healthcheckRoutes
