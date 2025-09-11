import Fastify from "fastify"
import { beforeAll, describe, expect, it } from "vitest"
import { setupOrgRoutes } from "../src/routes/orgs"
import { setupPermissionRoutes } from "../src/routes/permissions"

describe("Protected Endpoints", () => {
  let app: any

  beforeAll(async () => {
    app = Fastify()

    // Mock database
    ;(app as any).db = {
      selectFrom: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            select: () => ({
              where: () => ({
                execute: async () => [],
              }),
              execute: async () => [],
            }),
          }),
        }),
        select: () => ({
          where: () => ({
            executeTakeFirst: async () => null,
          }),
        }),
      }),
      insertInto: () => ({
        values: () => ({
          execute: async () => ({ id: 1 }),
        }),
      }),
    }

    // Register routes
    await app.register(setupPermissionRoutes, { prefix: "/permissions" })
    await app.register(setupOrgRoutes, { prefix: "/orgs" })

    await app.ready()
  })

  describe("Authentication Requirements", () => {
    it("should require authentication for POST /permissions/orgs/:orgId/roles", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/permissions/orgs/123/roles",
        payload: {
          name: "Test Role",
          permissions: [],
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for PUT /permissions/orgs/:orgId/roles/:roleId", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/permissions/orgs/123/roles/456",
        payload: {
          name: "Updated Role",
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for DELETE /permissions/orgs/:orgId/roles/:roleId", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/permissions/orgs/123/roles/456",
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for POST /orgs", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/orgs",
        payload: {
          name: "Test Org",
          handle: "test-org",
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for PUT /orgs/:id", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/orgs/123",
        payload: {
          name: "Updated Org",
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for DELETE /orgs/:id", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/orgs/123",
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for POST /orgs/:id/members", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/orgs/123/members",
        payload: {
          userId: "test-user-id",
          role: "member",
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for DELETE /orgs/:orgId/members/:memberId", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/orgs/123/members/456",
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })

    it("should require authentication for PUT /orgs/:orgId/members/:memberId/role", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/orgs/123/members/456",
        payload: {
          role: "admin",
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toHaveProperty("error", "Unauthorized")
    })
  })

  describe("Public Endpoints", () => {
    it("should allow access to GET /permissions/reference without authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/permissions/reference",
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveProperty("actions")
      expect(response.json()).toHaveProperty("subjects")
      expect(response.json()).toHaveProperty("roles")
    })

    it("should allow access to GET /orgs/check-handle/:handle without authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/orgs/check-handle/test-handle",
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveProperty("available")
    })
  })
})
