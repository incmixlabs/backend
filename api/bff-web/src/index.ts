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
  const auth = await fetch(`${env(c).AUTH_API_URL}${API.AUTH}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const email = await fetch(`${env(c).EMAIL_API_URL}${API.EMAIL}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const files = await fetch(`${env(c).FILES_API_URL}${API.FILES}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const intl = await fetch(`${env(c).INTL_API_URL}${API.INTL}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const org = await fetch(`${env(c).ORG_API_URL}${API.ORG}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const users = await fetch(`${env(c).USERS_API_URL}${API.USERS}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const todo = await fetch(`${env(c).TASKS_API_URL}${API.TASKS}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())
  const location = await fetch(
    `${env(c).LOCATION_API_URL}${API.LOCATION}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  return c.json(
    {
      auth,
      intl,
      files,
      email,
      users,
      org,
      todo,
      location,
    },
    200
  )
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
