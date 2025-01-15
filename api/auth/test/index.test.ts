import { env } from "cloudflare:test"
import app from "@"
import {
  BASE_PATH,
  EMAIL_ALREADY_VERIFIED,
  MAIL_SENT,
  USER_DEL,
} from "@/lib/constants"
import {
  deleteUser,
  getCurrentUser,
  login,
  signup,
} from "@/routes/auth/openapi"
import { sendVerificationEmail } from "@/routes/email-verification/openapi"
import { defaultHeaders, insertUser } from "@test/test-utils"
import { generateId } from "lucia"
import { beforeAll, describe, expect, test } from "vitest"

const jsonDefaultHeaders = {
  ...defaultHeaders,
  "content-type": "application/json",
}

describe("Auth worker tests", () => {
  beforeAll(async () => {
    await insertUser(env.DB, {
      email: "user1@example.com",
      password: "user1",
      emailVerified: true,
      id: generateId(7),
    })
    await insertUser(env.DB, {
      email: "user2@example.com",
      password: "user2",
      emailVerified: false,
      id: generateId(7),
    })

    return async () => {
      await env.DB.exec("delete from users")
    }
  })
  test("Get user without Auth", async () => {
    const res = await app.request(
      `${BASE_PATH}${getCurrentUser.getRoutingPath()}`,
      {
        method: "GET",
        headers: jsonDefaultHeaders,
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("signup new user invalid email", async () => {
    const res = await app.request(
      `${BASE_PATH}${signup.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          fullName: "John Doe",
          email: "wrong email",
          password: "12345678",
        }),
      },
      env
    )

    expect(res.status).toBe(422)

    const { errors } = await res.json<{
      errors: { zodError: { fieldErrors: Record<string, unknown> } }
    }>()

    expect(Object.hasOwn(errors.zodError.fieldErrors, "email")).toBe(true)
  })
  test("signup new user invalid password", async () => {
    const res = await app.request(
      `${BASE_PATH}${signup.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          fullName: "John Doe",
          email: "john.doe@example.com",
          password: "",
        }),
      },
      env
    )

    expect(res.status).toBe(422)

    const { errors } = await res.json<{
      errors: { zodError: { fieldErrors: Record<string, unknown> } }
    }>()

    expect(Object.hasOwn(errors.zodError.fieldErrors, "password")).toBe(true)
  })
  test("signup new user with valid data", async () => {
    const res = await app.request(
      `${BASE_PATH}${signup.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          fullName: "John Doe",
          email: "john.doe@example.com",
          password: "12345678",
        }),
      },
      env
    )

    expect(res.status).toBe(201)
  })
  test("signup with existing email", async () => {
    const res = await app.request(
      `${BASE_PATH}${signup.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          fullName: "User 1",
          email: "user1@example.com",
          password: "12345678",
        }),
      },
      env
    )

    expect(res.status).toBe(409)
  })
  test("login with incorrect email", async () => {
    const res = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user5@example.com",
          password: "12345678",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("login with incorrect password", async () => {
    const res = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user1@example.com",
          password: "12345678",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("login with correct credentials", async () => {
    const res = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user1@example.com",
          password: "user1",
        }),
      },
      env
    )
    const cookie = res.headers.get("set-cookie")

    expect(cookie).not.toBeNull()
    expect(res.status).toBe(200)
  })
  test("get user without auth", async () => {
    const res = await app.request(
      `${BASE_PATH}${getCurrentUser.getRoutingPath()}`,
      {
        method: "GET",
        headers: jsonDefaultHeaders,
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("get user after auth", async () => {
    const loginRes = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user1@example.com",
          password: "user1",
        }),
      },
      env
    )
    const cookie = loginRes.headers.get("set-cookie")?.split(";")[0]
    expect(cookie).not.toBeUndefined()
    const res = await app.request(
      `${BASE_PATH}${getCurrentUser.getRoutingPath()}`,
      {
        method: "GET",
        headers: { ...jsonDefaultHeaders, cookie: cookie as string },
      },
      env
    )

    expect(res.status).toBe(200)
  })
  test("verification email for non verified user", async () => {
    const res = await app.request(
      `${BASE_PATH}/verification-email${sendVerificationEmail.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({ email: "user2@example.com" }),
      },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({ message: MAIL_SENT.key })
  })
  test("verification email for already verified user", async () => {
    const res = await app.request(
      `${BASE_PATH}/verification-email${sendVerificationEmail.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({ email: "user1@example.com" }),
      },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({
      message: EMAIL_ALREADY_VERIFIED.key,
    })
  })

  test("delete user", async () => {
    const loginRes = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user1@example.com",
          password: "user1",
        }),
      },
      env
    )
    const cookie = loginRes.headers.get("set-cookie")?.split(";")[0]
    expect(cookie).not.toBeUndefined()
    const deleteRes = await app.request(
      `${BASE_PATH}${deleteUser.getRoutingPath()}`,
      {
        method: "DELETE",
        headers: { ...jsonDefaultHeaders, cookie: cookie as string },
      },
      env
    )

    expect(deleteRes.status).toBe(200)
    expect(await deleteRes.json()).toEqual({
      message: USER_DEL.key,
    })

    const reLoginRes = await app.request(
      `${BASE_PATH}${login.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          email: "user1@example.com",
          password: "user1",
        }),
      },
      env
    )

    expect(reLoginRes.status).toBe(401)
  })
})
