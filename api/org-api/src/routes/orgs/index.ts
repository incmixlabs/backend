import { createAuditMiddleware } from "@incmix-api/utils/audit"
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from "@incmix-api/utils/fastify-middleware/auth"
import { requireOrgPermission } from "@incmix-api/utils/fastify-middleware/rbac"
import type { FastifyInstance } from "fastify"

export const setupOrgRoutes = async (app: FastifyInstance) => {
  // Get database instance from app context
  const db = (app as any).db
  if (!db) {
    throw new Error("Database not initialized")
  }

  // Setup audit logging
  const { auditLogger, middleware: auditMiddleware } = createAuditMiddleware(db)

  // Register audit middleware for all routes
  app.addHook("onRequest", auditMiddleware)

  // Setup authentication middleware
  const requireAuth = createAuthMiddleware()
  const optionalAuth = createOptionalAuthMiddleware()
  // Get user's orgs (requires authentication)
  app.get(
    "/",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Get user's orgs",
        tags: ["orgs"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                handle: { type: "string" },
                description: { type: "string" },
                logo: { type: "string" },
                website: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get user orgs logic
      return []
    }
  )

  // Create org (requires authentication)
  app.post(
    "/",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Create a new org",
        tags: ["orgs"],
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            handle: { type: "string", minLength: 1 },
            description: { type: "string" },
            website: { type: "string" },
            logo: { type: "string" },
          },
          required: ["name", "handle"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              handle: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const body = request.body as {
        name: string
        handle: string
        description?: string
        website?: string
        logo?: string
      }
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "CREATE",
        "org",
        undefined,
        undefined,
        body
      )

      // TODO: Implement actual org creation logic in database
      return {
        id: "temp-id",
        name: body.name,
        handle: body.handle,
        message: "org created successfully",
      }
    }
  )

  // Get org by ID (requires authentication and membership)
  app.get(
    "/:id",
    {
      preHandler: [
        requireAuth,
        requireOrgPermission(db, "read", "Organisation"),
      ],
      schema: {
        description: "Get org by ID",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              handle: { type: "string" },
              description: { type: "string" },
              logo: { type: "string" },
              website: { type: "string" },
              members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement Get org by ID logic
      return {
        id: "temp-id",
        name: "temp-name",
        handle: "temp-handle",
        description: "temp-description",
        logo: "",
        website: "",
        members: [],
      }
    }
  )

  // Update org (requires authentication and update permission)
  app.put(
    "/:id",
    {
      preHandler: [
        requireAuth,
        requireOrgPermission(db, "update", "Organisation"),
      ],
      schema: {
        description: "Update an org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            website: { type: "string" },
            logo: { type: "string" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(request, "UPDATE", "Org", id, id, body)

      // TODO: Implement actual org update logic in database
      return { message: "Org updated successfully" }
    }
  )

  // Delete org (requires authentication and delete permission)
  app.delete(
    "/:id",
    {
      preHandler: [
        requireAuth,
        requireOrgPermission(db, "delete", "Organisation"),
      ],
      schema: {
        description: "Delete an org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { id } = request.params as { id: string }
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(request, "DELETE", "Org", id, id)

      // TODO: Implement actual org deletion logic in database
      return { message: "Org deleted successfully" }
    }
  )

  // Add member to org (requires authentication and manage permission)
  app.post(
    "/:id/members",
    {
      preHandler: [requireAuth, requireOrgPermission(db, "manage", "Member")],
      schema: {
        description: "Add member to org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            role: { type: "string" },
          },
          required: ["email", "role"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { id } = request.params as { id: string }
      const { email, role } = request.body as { email: string; role: string }
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "CREATE",
        "Member",
        undefined,
        id,
        { email, role }
      )

      // TODO: Implement actual add member logic in database
      return { message: "Member added successfully" }
    }
  )

  // Remove member from org (requires authentication and manage permission)
  app.delete(
    "/:orgId/members/:memberId",
    {
      preHandler: [requireAuth, requireOrgPermission(db, "manage", "Member")],
      schema: {
        description: "Remove member from org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            memberId: { type: "string" },
          },
          required: ["orgId", "memberId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { orgId, memberId } = request.params as {
        orgId: string
        memberId: string
      }
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "DELETE",
        "Member",
        memberId,
        orgId
      )

      // TODO: Implement actual remove member logic in database
      return { message: "Member removed successfully" }
    }
  )

  // Get org members (requires authentication and read permission)
  app.get(
    "/:id/members",
    {
      preHandler: [requireAuth, requireOrgPermission(db, "read", "Member")],
      schema: {
        description: "Get org members",
        tags: ["org"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                joinedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get org members logic
      return []
    }
  )

  // Get org permissions (requires authentication and read permission)
  app.get(
    "/:id/permissions",
    {
      preHandler: [requireAuth, requireOrgPermission(db, "read", "Permission")],
      schema: {
        description: "Get org permissions",
        tags: ["org"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              permissions: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    permissions: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get org permissions logic
      return {
        permissions: [],
        roles: [],
      }
    }
  )

  // Update member role (requires authentication and manage permission)
  app.put(
    "/:orgId/members/:memberId/role",
    {
      preHandler: [requireAuth, requireOrgPermission(db, "manage", "Member")],
      schema: {
        description: "Update member role in org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            memberId: { type: "string" },
          },
          required: ["orgId", "memberId"],
        },
        body: {
          type: "object",
          properties: {
            role: { type: "string" },
          },
          required: ["role"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { orgId, memberId } = request.params as {
        orgId: string
        memberId: string
      }
      const { role } = request.body as { role: string }
      const _user = request.user!

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "UPDATE",
        "Member",
        memberId,
        orgId,
        { role }
      )

      // TODO: Implement actual update member role logic in database
      return { message: "Member role updated successfully" }
    }
  )

  // Check handle availability (public endpoint)
  app.get(
    "/check-handle/:handle",
    {
      preHandler: [optionalAuth],
      schema: {
        description: "Check if org handle is available",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            handle: { type: "string" },
          },
          required: ["handle"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              available: { type: "boolean" },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement handle availability check logic
      return { available: true }
    }
  )
}
