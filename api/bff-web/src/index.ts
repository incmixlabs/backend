import { NotFoundError } from "@incmix-api/utils/errors"
import { setupCors } from "@incmix-api/utils/middleware"

import { serve } from "@hono/node-server"
import { API } from "@incmix/utils/env"
import { Hono } from "hono"
import { env } from "hono/adapter"
import { envVars } from "./env-vars"
import type { HonoApp } from "./types"

const app = new Hono<HonoApp>()

setupCors(app as any, "/api")

//
app.get("/api/timestamp", (c) => {
  return c.json({ time: Date.now() })
})
app.get("/api/timestamp-nano", (c) => {
  const [seconds, nanoseconds] = process.hrtime()
  const currentTimeInNanoseconds = seconds * 1e9 + nanoseconds
  return c.json({ time: currentTimeInNanoseconds })
})
app.get("/api/healthcheck", async (c) => {
  const apis = Object.entries(API)
  const results = []
  for (const [key, api] of apis) {
    if (key === "RATELIMITS") continue
    const apiUrl = envVars[`${key}_API_URL` as keyof typeof envVars]
    console.log(`${apiUrl}${api}/healthcheck`)
    const res = await fetch(`${apiUrl}/healthcheck`, {
      method: "get",
    }).then(async (res) => await res.json())
    results.push({
      [key]: res,
    })
  }
  return c.json(results, 200)
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

serve(
  {
    fetch: app.fetch,
    port: envVars.PORT,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`)
  }
)

export default app
