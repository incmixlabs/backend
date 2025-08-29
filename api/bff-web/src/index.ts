import { createService } from "@incmix-api/utils"
import { NotFoundError } from "@incmix-api/utils/errors"
import { setupCors } from "@incmix-api/utils/middleware"

import { API } from "@incmix/utils/env"
import { env } from "hono/adapter"
import { envVars } from "./env-vars"
import type { HonoApp } from "./types"
type Env = typeof envVars

const service = createService<HonoApp["Bindings"]>({
  name: "bff-web",
  port: envVars.PORT,
  basePath: "/api",
  setupMiddleware: (app) => {
    setupCors(app as any, "/api")
  },
  setupRoutes: (app) => {
    app.get("/api/timestamp", (c) => {
      return c.json({ time: Date.now() })
    })
    app.get("/api/timestamp-nano", (c) => {
      const ns = process.hrtime.bigint() // monotonic
      return c.json({ time: ns.toString(), monotonic: true })
    })
    app.get("/api/healthcheck", async (c) => {
      const apis = Object.entries(API)
      const cookies = c.req.raw.headers.get("cookie")
      const healthChecks = apis
        .filter(([key]) => key !== "RATELIMITS")
        .map(async ([key]) => {
          const apiUrl = env(c)[`${key}_API_URL` as keyof Env]
          try {
            const response = await fetch(`${apiUrl}/healthcheck`, {
              method: "GET",
              headers: {
                Cookie: cookies ?? "",
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

      return c.json(aggregatedResults, 200)
    })
    app.get("/api/rate-limits", async (c) => {
      const location = await fetch(
        `${envVars.LOCATION_API_URL}${API.LOCATION}/rate-limits`,
        {
          method: "get",
        }
      ).then(async (res) => await res.json())

      return c.json(
        {
          // auth,
          // intl,
          // files,
          // email,
          // users,
          // org,
          // todo,
          location,
        },
        200
      )
    })

    app.all("/api/*", async (c) => {
      const url = new URL(c.req.url)
      const pathname = url.pathname
      const searchParams = url.searchParams.toString()
      const queryString = searchParams ? `?${searchParams}` : ""

      const apis = Object.entries(API)
      for (const [key, api] of apis) {
        if (pathname.startsWith(api)) {
          const apiUrl = envVars[`${key}_API_URL` as keyof typeof envVars]
          const req = new Request(
            `${apiUrl}${pathname.replace(api, "")}${queryString}`,
            c.req.raw
          )
          const res = await fetch(req)
          return res
        }
      }

      throw new NotFoundError(`404: ${pathname} does not exist`)
    })
  },
})

const { app, startServer } = service

startServer()

export default app
