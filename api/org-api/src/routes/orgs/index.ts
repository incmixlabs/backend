import { createAuditMiddleware } from "@incmix-api/utils/audit"
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from "@incmix-api/utils/fastify-middleware/auth"
import { requireOrgPermission } from "@incmix-api/utils/fastify-middleware/rbac"
import type { FastifyInstance } from "fastify"

export const setupOrgRoutes = async (app: FastifyInstance) => {
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
      // TODO: Implement get user's orgs logic
      return []
    }
  )

  // Get org by ID (public endpoint)
  app.get(
    "/:orgId",
    {
      preHandler: [optionalAuth],
      schema: {
        description: "Get org by ID",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
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
              isPublic: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { orgId } = request.params as { orgId: string }

      // TODO: Implement get org by ID logic
      return {
        id: orgId,
        name: "Example Org",
        handle: "example-org",
        description: "Example organization",
        logo: "",
        website: "",
        isPublic: true,
      }
    }
  )

  // Create new org (requires authentication)
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
            logo: { type: "string" },
            website: { type: "string" },
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
      const { name, handle, description, logo, website } = request.body as {
        name: string
        handle: string
        description?: string
        logo?: string
        website?: string
      }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "CREATE",
        "Org",
        undefined,
        undefined,
        { name, handle, description, logo, website }
      )

      // TODO: Implement actual create org logic in database
      return {
        id: "temp-id",
        name,
        handle,
        message: "Org created successfully",
      }
    }
  )

  // Update org (requires authentication and update permission)
  app.put(
    "/:orgId",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Update an org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            logo: { type: "string" },
            website: { type: "string" },
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
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const body = request.body as any
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Check org permission
      await requireOrgPermission(db, "update", "Organisation")(request, reply)

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "UPDATE",
        "Org",
        orgId,
        orgId,
        body
      )

      // TODO: Implement actual update org logic in database
      return { message: "Org updated successfully" }
    }
  )

  // Delete org (requires authentication and delete permission)
  app.delete(
    "/:orgId",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Delete an org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
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
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Check org permission
      await requireOrgPermission(db, "delete", "Organisation")(request, reply)

      // Log the mutation
      await auditLogger.logMutation(request, "DELETE", "Org", orgId, orgId)

      // TODO: Implement actual delete org logic in database
      return { message: "Org deleted successfully" }
    }
  )

  // Add member to org (requires authentication and manage permission)
  app.post(
    "/:orgId/members",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Add member to org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
        body: {
          type: "object",
          properties: {
            userId: { type: "string" },
            role: { type: "string" },
          },
          required: ["userId", "role"],
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
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }
      const { userId, role } = request.body as { userId: string; role: string }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Check org permission
      await requireOrgPermission(db, "manage", "Member")(request, reply)

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "CREATE",
        "OrgMember",
        undefined,
        orgId,
        { userId, role }
      )

      // TODO: Implement actual add member logic in database
      return { message: "Member added to org successfully" }
    }
  )

  // Remove member from org (requires authentication and manage permission)
  app.delete(
    "/:orgId/members/:userId",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Remove member from org",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            userId: { type: "string" },
          },
          required: ["orgId", "userId"],
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
    async (request, reply) => {
      const { orgId, userId } = request.params as {
        orgId: string
        userId: string
      }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Check org permission
      await requireOrgPermission(db, "manage", "Member")(request, reply)

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "DELETE",
        "OrgMember",
        userId,
        orgId
      )

      // TODO: Implement actual remove member logic in database
      return { message: "Member removed from org successfully" }
    }
  )

  // Update member role (requires authentication and manage permission)
  app.put(
    "/:orgId/members/:userId",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Update member role",
        tags: ["orgs"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            userId: { type: "string" },
          },
          required: ["orgId", "userId"],
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
    async (request, reply) => {
      const { orgId, userId } = request.params as {
        orgId: string
        userId: string
      }
      const { role } = request.body as { role: string }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Check org permission
      await requireOrgPermission(db, "manage", "Member")(request, reply)

      // Log the mutation
      await auditLogger.logMutation(
        request,
        "UPDATE",
        "OrgMember",
        userId,
        orgId,
        { role }
      )

      // TODO: Implement actual update member role logic in database
      return { message: "Member role updated successfully" }
    }
  )

  // Check if org handle is available (public endpoint)
  app.get(
    "/check-handle/:handle",
    {
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
    async (request, _reply) => {
      const { handle } = request.params as { handle: string }

      // TODO: Implement actual handle availability check logic
      return { available: true }
    }
  )
}
