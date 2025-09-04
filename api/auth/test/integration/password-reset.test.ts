import { beforeEach, describe, expect, it } from "vitest"
import { testDb } from "../utils/setup"
import { createSignupData, createTestClient } from "../utils/test-helpers"

describe("Password Reset Integration Tests", () => {
  const client = createTestClient()

  beforeEach(async () => {
    // Clean up database before each test
    const db = testDb.getDb()
    await db.deleteFrom("sessions").execute()
    await db.deleteFrom("verificationCodes").execute()
    await db.deleteFrom("accounts").execute()
    await db.deleteFrom("userProfiles").execute()
    await db.deleteFrom("users").execute()
  })

  describe("POST /api/auth/reset-password/send", () => {
    it("should send reset password email for existing user", async () => {
      // Create a test user with unique email
      const userData = createSignupData({
        email: `reset-${Date.now()}@example.com`,
        password: "oldpassword123",
        fullName: "Reset User",
      })

      await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const response = await client.request("/reset-password/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("message")
      expect(body.message).toContain("sent")
    })

    it("should return 404 for non-existent user (security)", async () => {
      const response = await client.request("/reset-password/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "nonexistent@example.com",
        }),
      })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body).toHaveProperty("message")
    })

    it("should return 422 for invalid email format", async () => {
      const response = await client.request("/reset-password/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid-email",
        }),
      })

      expect(response.status).toBe(422)
    })
  })

  describe("POST /api/auth/reset-password/forget", () => {
    let resetCode: string
    let userEmail: string

    beforeEach(async () => {
      // Create a test user with unique email
      userEmail = `confirm-${Date.now()}@example.com`
      const userData = createSignupData({
        email: userEmail,
        password: "oldpassword123",
        fullName: "Confirm User",
      })

      await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      // Request password reset
      await client.request("/reset-password/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      })

      // Get the reset code from database (in real scenario, this would come from email)
      const db = testDb.getDb()

      const verificationCode = await db
        .selectFrom("verificationCodes")
        .selectAll()
        .where("email", "=", userEmail)
        .where("codeType", "=", "reset_password")
        .executeTakeFirst()

      // Use fallback code if verification code is not found
      resetCode = verificationCode?.code || "test-code-12345"
    })

    it("should reset password successfully with valid code", async () => {
      // For this test, we need a real verification code, so skip if not available
      const db = testDb.getDb()
      const verificationCode = await db
        .selectFrom("verificationCodes")
        .selectAll()
        .where("email", "=", userEmail)
        .where("codeType", "=", "reset_password")
        .executeTakeFirst()

      expect(verificationCode?.code).toBeDefined()

      const response = await client.request("/reset-password/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode?.code,
          newPassword: "newpassword123",
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("message")
      expect(body.message).toContain("success")

      // Verify user can login with new password
      const loginResponse = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: "newpassword123",
        }),
      })

      expect(loginResponse.status).toBe(200)
    })

    it("should return 401 for invalid reset code", async () => {
      const response = await client.request("/reset-password/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          code: "invalid-code",
          newPassword: "newpassword123",
        }),
      })

      expect(response.status).toBe(401)
    })

    it("should return 401 for weak new password", async () => {
      const response = await client.request("/reset-password/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          code: resetCode,
          newPassword: "123",
        }),
      })

      expect(response.status).toBe(401)
    })

    it("should return 404 for non-existent user", async () => {
      const response = await client.request("/reset-password/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          code: resetCode,
          newPassword: "newpassword123",
        }),
      })

      expect(response.status).toBe(404)
    })
  })
})
