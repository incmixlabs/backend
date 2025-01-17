import { OpenAPIHono } from "@hono/zod-openapi"
import { NotFoundError } from "@incmix-api/utils/errors"
import { setupCors } from "@incmix-api/utils/middleware"

import { API } from "@jsprtmnn/utils/env"
import type { HonoApp } from "./types"

const app = new OpenAPIHono<HonoApp>()

setupCors(app, "/api")

app.get("/api/healthcheck", async (c) => {
  const auth = await c.env.AUTH_API.fetch(
    `${c.env.AUTH_URL}${API.AUTH}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const email = await c.env.EMAIL_API.fetch(
    `${c.env.EMAIL_URL}${API.EMAIL}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const files = await c.env.FILES_API.fetch(
    `${c.env.FILES_URL}${API.FILES}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const intl = await c.env.INTL_API.fetch(
    `${c.env.INTL_URL}${API.INTL}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const org = await c.env.ORG_API.fetch(
    `${c.env.ORG_URL}${API.ORG}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const users = await c.env.USERS_API.fetch(
    `${c.env.USERS_URL}${API.USERS}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())

  const todo = await c.env.TODO_API.fetch(
    `${c.env.TODO_URL}${API.TASKS}/healthcheck`,
    { method: "get" }
  ).then(async (res) => await res.json())
  const location = await c.env.LOCATION_API.fetch(
    `${c.env.LOCATION_URL}${API.LOCATION}/healthcheck`,
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
  // const auth = await c.env.AUTH_API.fetch(
  //   `${c.env.AUTH_URL}${AUTH_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const email = await c.env.EMAIL_API.fetch(
  //   `${c.env.EMAIL_URL}${EMAIL_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const files = await c.env.FILES_API.fetch(
  //   `${c.env.FILES_URL}${FILES_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const intl = await c.env.INTL_API.fetch(
  //   `${c.env.INTL_URL}${INTL_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const org = await c.env.ORG_API.fetch(
  //   `${c.env.ORG_URL}${ORG_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const users = await c.env.USERS_API.fetch(
  //   `${c.env.USERS_URL}${USERS_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())

  // const todo = await c.env.TODO_API.fetch(
  //   `${c.env.TODO_URL}${TODO_BASE_PATH}/rate-limits`,
  //   { method: "get" }
  // ).then(async (res) => await res.json())
  const location = await c.env.LOCATION_API.fetch(
    `${c.env.LOCATION_URL}${API.LOCATION}/rate-limits`,
    { method: "get" }
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
    const res = await c.env.AUTH_API.fetch(
      `${c.env.AUTH_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }
  if (pathname.startsWith(API.ORG)) {
    const res = await c.env.ORG_API.fetch(
      `${c.env.ORG_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }
  if (pathname.startsWith(API.USERS)) {
    const res = await c.env.USERS_API.fetch(
      `${c.env.USERS_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }
  if (pathname.startsWith(API.INTL)) {
    const res = await c.env.INTL_API.fetch(
      `${c.env.INTL_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }
  if (pathname.startsWith(API.TASKS)) {
    const res = await c.env.TODO_API.fetch(
      `${c.env.TODO_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }
  if (pathname.startsWith(API.LOCATION)) {
    const res = await c.env.LOCATION_API.fetch(
      `${c.env.LOCATION_URL}${pathname}${queryString}`,
      c.req.raw
    )
    return res
  }

  throw new NotFoundError(`404: ${pathname} does not exist`)
})

export default app
