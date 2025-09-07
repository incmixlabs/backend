import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createTestClient } from "../utils/test-helpers"

describe("Health Check Integration Tests", () => {
  let client: Awaited<ReturnType<typeof createTestClient>>

  beforeAll(async () => {
    client = await createTestClient()
  })

  afterAll(async () => {
    await client.close()
  })

  describe("GET /api/auth/healthcheck", () => {
    it("should return 200 OK with basic health info", async () => {
      console.log("Making request to /healthcheck...")
      const response = await client.request("/healthcheck", { method: "GET" })
      console.log("Response received:", response.status)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("status", "ok")
      expect(body).toHaveProperty("service", "auth-api")
      expect(body).toHaveProperty("timestamp")
    }, 10000) // 10 second timeout for this specific test
  })
})
