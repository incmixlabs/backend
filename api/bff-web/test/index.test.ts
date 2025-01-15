import { env } from "cloudflare:test"
import { describe, expect, test } from "vitest"
import app from "../src"
import { defaultHeaders } from "./test-utils"

describe("BFF API Tests", () => {
  describe("Auth API forwarding", () => {
    test("should forward route without parameters", async () => {
      const res = await app.request(
        "/api/auth/validate-session",
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({
        id: "user_1",
        email: "user@example.com",
        emailVerified: true,
      })
    })

    test("should forward route with body", async () => {
      const res = await app.request(
        "/api/auth/login",
        {
          method: "POST",
          headers: defaultHeaders,
          body: JSON.stringify({
            email: "user@example.com",
            password: "password",
          }),
        },
        env
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: "user_1",
          email: "user@example.com",
          emailVerified: true,
        },
        session: {
          id: "session_1",
        },
      })
    })

    test("should forward route with query parameters", async () => {
      const res = await app.request(
        "/api/auth/users?email=user@example.com",
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({
        id: "user_1",
        email: "user@example.com",
        emailVerified: true,
      })
    })
  })
})
