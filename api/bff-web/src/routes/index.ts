import type { FastifyInstance } from "fastify"
import { envVars } from "../env-vars"

// Only include services that have been migrated to Fastify+AJV
const MIGRATED_SERVICES = {
  auth: {
    prefix: "/api/auth",
    upstream: envVars.AUTH_API_URL?.replace("/api/auth", ""),
  },
  org: {
    prefix: "/api/org",
    upstream: envVars.ORG_API_URL?.replace("/api/org", ""),
  },
  projects: {
    prefix: "/api/projects",
    upstream: envVars.PROJECTS_API_URL?.replace("/api/projects", ""),
  },
} as const

export const setupRoutes = async (app: FastifyInstance) => {
  // Health check endpoint
  app.get("/api/healthcheck", async (_request, reply) => {
    const healthChecks = await Promise.allSettled(
      Object.entries(MIGRATED_SERVICES).map(async ([serviceName, config]) => {
        try {
          const response = await fetch(`${config.upstream}/healthcheck`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
          })

          if (!response.ok) {
            return {
              [serviceName]: {
                status: "DOWN",
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            }
          }

          const data = await response.json()
          return { [serviceName]: data }
        } catch (error) {
          return {
            [serviceName]: {
              status: "DOWN",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            },
          }
        }
      })
    )

    const results = healthChecks.map((result) =>
      result.status === "fulfilled" ? result.value : {}
    )

    return reply.code(200).send(results)
  })

  // Timestamp endpoints for compatibility
  app.get("/api/timestamp", async (_request, reply) => {
    return reply.send({ time: Date.now() })
  })

  app.get("/api/timestamp-nano", async (_request, reply) => {
    const ns = process.hrtime.bigint()
    return reply.send({ time: ns.toString(), monotonic: true })
  })

  // Register HTTP proxy for each migrated service
  // IMPORTANT: Register proxy routes first, then override specific paths
  for (const [serviceName, config] of Object.entries(MIGRATED_SERVICES)) {
    console.log(
      `Registering proxy for ${serviceName}: ${config.prefix} -> ${config.upstream}`
    )

    await app.register(import("@fastify/http-proxy"), {
      upstream: config.upstream,
      prefix: config.prefix,
      rewritePrefix: config.prefix,
      // Forward all headers including cookies
      http2: false,
    })
  }

  // Custom reference endpoints that serve Scalar UI with corrected server URLs
  // IMPORTANT: These must be registered AFTER proxy to override the proxy routes
  for (const [_serviceName, config] of Object.entries(MIGRATED_SERVICES)) {
    app.get(`${config.prefix}/reference`, async (_request, reply) => {
      // Redirect to reference/ with trailing slash
      return reply.code(301).redirect(`${config.prefix}/reference/`)
    })

    app.get(`${config.prefix}/reference/`, async (_request, reply) => {
      const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>

    <!-- Initialize the Scalar API Reference -->
    <script type="text/javascript">
      Scalar.createApiReference('#app', {
        "_integration": "fastify",
        "layout": "modern",
        "showSidebar": true,
        "searchHotKey": "k", 
        "darkMode": true,
        "spec": {
          "url": "${config.prefix}/docs/json"
        },
        "theme": "default",
        "servers": [
          {
            "url": "http://localhost:8080",
            "description": "BFF Development Server"
          }
        ],
        "authentication": {
          "preferredSecurityScheme": "cookieAuth"
        }
      })
    </script>
  </body>
</html>`

      return reply.type("text/html").send(html)
    })
  }

  // Catch-all for non-migrated services - return 503 Service Unavailable
  app.all("/api/*", async (request, reply) => {
    const path = request.url
    const availableServices = Object.keys(MIGRATED_SERVICES).join(", ")

    return reply.code(503).send({
      error: "Service Unavailable",
      message: `The requested service at ${path} has not been migrated to the new architecture yet.`,
      availableServices: availableServices,
      migrationStatus:
        "This service is still using Hono+Zod and needs to be migrated to Fastify+AJV",
    })
  })
}
