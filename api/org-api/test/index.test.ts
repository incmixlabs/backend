import { env } from "cloudflare:test"
import app from "@"
import { BASE_PATH } from "@/lib/constants"
import type { OrgSchema } from "@/routes/organisations/types"
import { beforeAll, describe, expect, test } from "vitest"
import type { z } from "zod"
import { defaultHeaders, insertOrganisation } from "./test-utils"

describe("Organisations tests", () => {
  beforeAll(async () => {
    await insertOrganisation(env.DB, {
      id: "org_1",
      name: "Org 1",
      handle: "org-1",
      ownerId: "user_1",
    })

    await insertOrganisation(env.DB, {
      id: "org_2",
      name: "Org 2",
      handle: "org-2",
      ownerId: "user_2",
    })

    return async () => {
      await env.DB.exec("delete from organisations")
      await env.DB.exec("delete from members")
    }
  })

  test("Get users organisation", async () => {
    const res = await app.request(
      `${BASE_PATH}/user`,
      {
        method: "GET",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(200)
    const data = await res.json<z.infer<typeof OrgSchema>[]>()
    expect(data.length).toBe(1)
  })

  test("Create Organisation without auth", async () => {
    const res = await app.request(
      BASE_PATH,
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          name: "Test Organsiation",
          handle: "test-organsiation",
          members: [],
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Create Organisation with auth", async () => {
    const res = await app.request(
      BASE_PATH,
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          name: "Test Organsiation",
          handle: "test-organsiation",
          members: [],
        }),
      },
      env
    )

    expect(res.status).toBe(201)
  })
  test("Create Organisation with duplicate name", async () => {
    const res = await app.request(
      BASE_PATH,
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          name: "Org 1",
          handle: "org-4",
          members: [],
        }),
      },
      env
    )

    expect(res.status).toBe(409)
  })
  test("Create Organisation with one member", async () => {
    const res = await app.request(
      BASE_PATH,
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          name: "Org with member",
          handle: "Org-with-member",
          members: [
            {
              userId: "user_2",
              role: "viewer",
            },
          ],
        }),
      },
      env
    )

    expect(res.status).toBe(201)
    const data = await res.json<z.infer<typeof OrgSchema>>()

    expect(data.members.length).toBe(2)
  })
  test("Update Organisation without auth", async () => {
    const res = await app.request(
      `${BASE_PATH}/org_2`,
      {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify({
          name: "Updated Org",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Update Organisation with auth", async () => {
    const res = await app.request(
      `${BASE_PATH}/org-2`,
      {
        method: "PUT",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_2` },
        body: JSON.stringify({
          name: "Updated Org",
        }),
      },
      env
    )

    expect(res.status).toBe(200)

    const data = await res.json<z.infer<typeof OrgSchema>>()
    expect(data.name).toBe("Updated Org")
  })

  test("Add member invalid user", async () => {
    const res = await app.request(
      `${BASE_PATH}/org-1/members`,
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          email: "user3@example.com",
          role: "editor",
        }),
      },
      env
    )

    expect(res.status).toBe(404)
  })

  test("Add member valid user", async () => {
    const res = await app.request(
      `${BASE_PATH}/org-1/members`,
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          email: "user2@example.com",
          role: "editor",
        }),
      },
      env
    )

    expect(res.status).toBe(200)
    const data = await res.json<z.infer<typeof OrgSchema>>()
    expect(data.members).toContainEqual({ userId: "user_2", role: "editor" })
  })

  test("Remove member", async () => {
    const res = await app.request(
      `${BASE_PATH}/org-1/members`,
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          userIds: ["user_2"],
        }),
      },
      env
    )

    expect(res.status).toBe(200)
  })
  test("Remove owner", async () => {
    const res = await app.request(
      `${BASE_PATH}/org-1/members`,
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          userIds: ["user_1"],
        }),
      },
      env
    )

    expect(res.status).toBe(412)
  })
})
