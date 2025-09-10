import { describe, expect, it } from "vitest"
import { createTestClient } from "../utils/test-helpers"

describe("Simple Route Test", () => {
  describe("GET /api/auth/test-direct", () => {
    it("should return direct test message", async () => {
      const client = await createTestClient()
      const response = await client.request("/test-direct", { method: "GET" })

      console.log("Response status:", response.status)
      console.log("Response body:", await response.text())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("message", "Direct route works!")
    })
  })

  describe("GET /api/auth/test", () => {
    it("should return test message", async () => {
      const client = await createTestClient()
      const response = await client.request("/test", { method: "GET" })

      console.log("Response status:", response.status)
      console.log("Response body:", await response.text())

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty("message", "Test route works!")
    })
  })
})
