import { API } from "@incmix/utils/env"
import { createService } from "@incmix-api/utils"
import { NotFoundError } from "@incmix-api/utils/errors"
import { setupCors } from "@incmix-api/utils/middleware"
import { envVars } from "./env-vars"
import type { Bindings, Variables } from "./types"

type Env = typeof envVars

const service = await createService<Bindings, Variables>({
  name: "bff-web",
  port: envVars.PORT,
  basePath: "/api",
  setupMiddleware: async (app) => {
    await setupCors(app, "/api")
  },
  setupRoutes: (app) => {
    app.get("/api/timestamp", (_request, reply) => {
      return reply.send({ time: Date.now() })
    })
    app.get("/api/timestamp-nano", (_request, reply) => {
      const ns = process.hrtime.bigint() // monotonic
      return reply.send({ time: ns.toString(), monotonic: true })
    })
    app.get("/api/healthcheck", async (request, reply) => {
      const apis = Object.entries(API)
      const cookies = request.headers.cookie || ""
      const healthChecks = apis.map(async ([key]) => {
        const apiUrl = envVars[`${key.toUpperCase()}_API_URL` as keyof Env]
        try {
          const response = await fetch(`${apiUrl}/healthcheck`, {
            method: "GET",
            headers: {
              Cookie: cookies,
            },
            signal: AbortSignal.timeout(envVars.TIMEOUT_MS), // 5 second timeout
          })

          if (!response.ok) {
            return {
              [key]: {
                status: "DOWN",
                error: `HTTP ${response.status}: ${response.statusText}`,
                timestamp: new Date().toISOString(),
              },
            }
          }

          const data = await response.json()
          return {
            [key]: data,
          }
        } catch (error) {
          return {
            [key]: {
              status: "DOWN",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            },
          }
        }
      })

      const results = await Promise.allSettled(healthChecks)

      // Aggregate results, handling any promise rejections
      const aggregatedResults = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value
        }
        // If the promise itself was rejected, create an error result
        const [key] = apis.filter(([k]) => k !== "RATELIMITS")[index]
        return {
          [key]: {
            status: "DOWN",
            error: "Health check promise rejected",
            timestamp: new Date().toISOString(),
          },
        }
      })

      return reply.send(aggregatedResults)
    })
    app.get("/api/rate-limits", async (_request, reply) => {
      const location = await fetch(`${envVars.LOCATION_API_URL}/rate-limits`, {
        method: "get",
      }).then(async (res) => await res.json())

      return reply.send({
        // auth,
        // intl,
        // files,
        // email,
        // users,
        // org,
        // todo,
        location,
      })
    })

    app.all("/api/*", async (request, reply) => {
      const url = new URL(request.url, `http://${request.headers.host}`)
      const pathname = url.pathname
      const searchParams = url.searchParams.toString()
      const queryString = searchParams ? `?${searchParams}` : ""

      const apis = Object.entries(API)
      for (const [key, api] of apis) {
        if (pathname.startsWith(api)) {
          const apiUrl = envVars[`${key}_API_URL` as keyof typeof envVars]
          const req = new Request(
            `${apiUrl}${pathname.replace(api, "")}${queryString}`,
            {
              method: request.method,
              headers: request.headers as any,
              body:
                request.method !== "GET" && request.method !== "HEAD"
                  ? JSON.stringify(request.body)
                  : undefined,
            }
          )
          const res = await fetch(req)
          const data = await res.text()

          reply.code(res.status)
          res.headers.forEach((value, key) => {
            reply.header(key, value)
          })

          return reply.send(data)
        }
      }

      throw new NotFoundError(`404: ${pathname} does not exist`)
    })
  },
  bindings: envVars,
})

const { app, startServer } = service

startServer()

export default app
