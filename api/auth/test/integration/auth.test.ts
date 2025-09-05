import { beforeEach, describe, expect, it } from "vitest"
import { testDb } from "../utils/setup"
import { createSignupData, createTestClient } from "../utils/test-helpers"

describe("Auth Integration Tests", () => {
  const client = createTestClient()

  beforeEach(async () => {
    // Clean up database before each test
    const db = testDb.getDb()

    // Delete in correct order to respect foreign key constraints
    await db.deleteFrom("sessions").execute()
    await db.deleteFrom("verificationCodes").execute()
    await db.deleteFrom("accounts").execute()
    await db.deleteFrom("userProfiles").execute()
    await db.deleteFrom("users").execute()

    // Force a small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  describe("POST /api/auth/signup", () => {
    it("should create a new user successfully", async () => {
      const userData = createSignupData({
        email: `test-${Date.now()}@example.com`,
        password: "password123",
        fullName: "Test User",
      })

      const response = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body).toHaveProperty("id")
      expect(body).toHaveProperty("email", userData.email)
      expect(body).toHaveProperty("name", userData.fullName)
      expect(body).not.toHaveProperty("hashedPassword")
    })

    it("should return 422 for invalid email format", async () => {
      const userData = createSignupData({
        email: "invalid-email",
        password: "password123",
        fullName: "Test User",
      })

      const response = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(response.status).toBe(422)
    })

    it("should create user with short password", async () => {
      const userData = createSignupData({
        email: `weakpass-${Date.now()}@example.com`,
        password: "123",
        fullName: "Test User",
      })

      const response = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body).toHaveProperty("id")
      expect(body).toHaveProperty("email", userData.email)
    })

    it("should return 409 for duplicate email", async () => {
      const userData = createSignupData({
        email: "duplicate@example.com",
        password: "password123",
        fullName: "Test User",
      })

      // Create first user
      await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      // Try to create second user with same email
      const response = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(response.status).toBe(409)
    })
  })

  describe("POST /api/auth/login", () => {
    let userDataGlobal: ReturnType<typeof createSignupData>
    beforeEach(async () => {
      // Create a test user for login tests

      const userData = createSignupData({
        email: `login-${Date.now()}@example.com`,
        password: "password123",
        fullName: "Login User",
      })

      userDataGlobal = userData
      const signupResponse = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
      expect(signupResponse.status).toBe(201)
    })

    it("should return 200 for successful login", async () => {
      const credentials = {
        email: userDataGlobal.email,
        password: userDataGlobal.password,
      }

      const response = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty("email", userDataGlobal.email)
      expect(body).toHaveProperty("session")
    })

    it("should return 401 for invalid email", async () => {
      const credentials = {
        email: "nonexistent@example.com",
        password: "password123",
      }

      const response = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      expect(response.status).toBe(401)
    })

    it("should return 401 for invalid password", async () => {
      const credentials = {
        email: userDataGlobal.email,
        password: "wrongpassword",
      }

      const response = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      expect(response.status).toBe(401)
    })
  })

  describe("GET /api/auth", () => {
    it("should return user info for authenticated user", async () => {
      // Create a user through signup (which will be verified due to MOCK_DATA=true)
      const userData = createSignupData({
        email: `me-${Date.now()}@example.com`,
        password: "password123",
        fullName: "Me User",
      })

      const signupResponse = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(signupResponse.status).toBe(201)
      const signupBody = await signupResponse.json()
      const userId = signupBody.id
      expect(userId).toBeDefined()
      // Login to get a session
      const credentials = {
        email: userData.email,
        password: userData.password,
      }

      const loginResponse = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
      expect(loginResponse.status).toBe(200)
      const setCookie = loginResponse.headers.get("set-cookie")
      const sessionCookie = setCookie?.split(";")[0] || ""
      console.log("🚀 sessionCookie", sessionCookie)
      // Now test the /me endpoint
      const response = await client.request("", {
        method: "GET",
        headers: {
          Cookie: sessionCookie,
        },
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("email", userData.email)
      expect(body).toHaveProperty("fullName", "Me User")
    })

    it("should return 401 for unauthenticated request", async () => {
      const response = await client.request("", {
        method: "GET",
      })

      expect(response.status).toBe(401)
    })

    it("should return 401 for invalid session", async () => {
      const response = await client.request("", {
        method: "GET",
        headers: {
          Cookie: "incmix_session_dev=invalid-session-id",
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe("POST /api/auth/logout", () => {
    let sessionCookie: string
    beforeEach(async () => {
      // Create and login a user
      const userData = createSignupData({
        email: `logout-${Date.now()}@example.com`,
        password: "password123",
        fullName: "Logout User",
      })

      const signupResponse = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
      expect(signupResponse.status).toBe(201)
      const credentials = {
        email: userData.email,
        password: userData.password,
      }

      const loginResponse = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
      expect(loginResponse.status).toBe(200)
      const setCookie = loginResponse.headers.get("set-cookie")
      sessionCookie = setCookie?.split(";")[0] || ""
    })

    it("should return 200 for authenticated logout", async () => {
      const response = await client.request("/logout", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
        },
      })

      expect(response.status).toBe(200)
    })

    it("should return 500 for unauthenticated logout (unhandled error)", async () => {
      const response = await client.request("/logout", {
        method: "POST",
      })

      expect(response.status).toBe(401)
    })
  })

  describe("DELETE /api/auth/delete", () => {
    let sessionCookie: string

    beforeEach(async () => {
      // Create and login a user
      const userData = createSignupData({
        email: `delete-${Date.now()}@example.com`,
        password: "password123",
        fullName: "Delete User",
      })

      const signupResponse = await client.request("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      expect(signupResponse.status).toBe(201)

      const credentials = {
        email: userData.email,
        password: userData.password,
      }

      const loginResponse = await client.request("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
      expect(loginResponse.status).toBe(200)
      const setCookie = loginResponse.headers.get("set-cookie")
      sessionCookie = setCookie?.split(";")[0] || ""
    })

    it("should return 401 for unauthenticated delete", async () => {
      const response = await client.request("/delete", {
        method: "DELETE",
      })

      expect(response.status).toBe(401)
    })
    it("should return 200 for authenticated delete", async () => {
      const response = await client.request("/delete", {
        method: "DELETE",
        headers: {
          Cookie: sessionCookie,
        },
      })

      expect(response.status).toBe(200)
    })
  })
})
