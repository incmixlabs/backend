import { OpenAPIHono } from "@hono/zod-openapi"
import { NotFoundError } from "@incmix-api/utils/errors"
import { setupCors } from "@incmix-api/utils/middleware"

import { serve } from "@hono/node-server"
import { API } from "@incmix/utils/env"
import { compress } from "hono/compress"
import { envVars } from "./env-vars"
import type { HonoApp } from "./types"
import { returnResponse } from "./utils"

const app = new OpenAPIHono<HonoApp>()

setupCors(app, "/api")

app.use("*", compress({ encoding: "gzip" }))

app.get("/api/healthcheck", async (c) => {
  const auth = await fetch(`${envVars.AUTH_URL}${API.AUTH}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const email = await fetch(`${envVars.EMAIL_URL}${API.EMAIL}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const files = await fetch(`${envVars.FILES_URL}${API.FILES}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const intl = await fetch(`${envVars.INTL_URL}${API.INTL}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const org = await fetch(`${envVars.ORG_URL}${API.ORG}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const users = await fetch(`${envVars.USERS_URL}${API.USERS}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())

  const todo = await fetch(`${envVars.TASKS_URL}${API.TASKS}/healthcheck`, {
    method: "get",
  }).then(async (res) => await res.json())
  const location = await fetch(
    `${envVars.LOCATION_URL}${API.LOCATION}/healthcheck`,
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
  // const auth = await envVars.AUTH_API.fetch(
  //   `${envVars.AUTH_URL}${AUTH_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const email = await envVars.EMAIL_API.fetch(
  //   `${envVars.EMAIL_URL}${EMAIL_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const files = await envVars.FILES_API.fetch(
  //   `${envVars.FILES_URL}${FILES_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const intl = await envVars.INTL_API.fetch(
  //   `${envVars.INTL_URL}${INTL_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const org = await envVars.ORG_API.fetch(
  //   `${envVars.ORG_URL}${ORG_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const users = await envVars.USERS_API.fetch(
  //   `${envVars.USERS_URL}${USERS_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const todo = await envVars.TODO_API.fetch(
  //   `${envVars.TODO_URL}${TODO_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())
  const location = await fetch(
    `${envVars.LOCATION_URL}${API.LOCATION}/rate-limits`,
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

  if (pathname.startsWith(API.AUTH)) {
    const req = new Request(
      `${envVars.AUTH_URL}${pathname}${queryString}`,
      c.req.raw
    )

    const res = await fetch(req)
    return returnResponse(res, c)
  }
  if (pathname.startsWith(API.ORG)) {
    const req = new Request(
      `${envVars.ORG_URL}${pathname}${queryString}`,
      c.req.raw
    )
    const res = await fetch(req)

    return returnResponse(res, c)
  }
  if (pathname.startsWith(API.USERS)) {
    const req = new Request(
      `${envVars.USERS_URL}${pathname}${queryString}`,
      c.req.raw
    )
    const res = await fetch(req)
    return returnResponse(res, c)
  }
  if (pathname.startsWith(API.INTL)) {
    const req = new Request(
      `${envVars.INTL_URL}${pathname}${queryString}`,
      c.req.raw
    )
    const res = await fetch(req)
    return returnResponse(res, c)
  }
  if (pathname.startsWith(API.TASKS)) {
    const req = new Request(
      `${envVars.TASKS_URL}${pathname}${queryString}`,
      c.req.raw
    )
    const res = await fetch(req)
    return returnResponse(res, c)
  }
  if (pathname.startsWith(API.LOCATION)) {
    const req = new Request(
      `${envVars.LOCATION_URL}${pathname}${queryString}`,
      c.req.raw
    )
    const res = await fetch(req)
    return returnResponse(res, c)
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
