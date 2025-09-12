import { createAuditMiddleware } from "@incmix-api/utils/audit"
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from "@incmix-api/utils/fastify-middleware/auth"
import { requireOrgPermission } from "@incmix-api/utils/fastify-middleware/rbac"
import type { FastifyInstance } from "fastify"
import {
  addPermissionToRole,
  createRoleWithPermissions,
  deleteRoleById,
  getRolesWithPermissions,
  removePermissionFromRole,
  updateRoleWithPermissions,
} from "../../lib/db"

export const setupPermissionRoutes = (app: FastifyInstance) => {
  // Setup authentication middleware
  const requireAuth = createAuthMiddleware()
  const optionalAuth = createOptionalAuthMiddleware()

  // Get all available permissions reference data (public endpoint)
  app.get(
    "/reference",
    {
      preHandler: [optionalAuth],
      schema: {
        description: "Get permissions reference data",
        tags: ["permissions"],
        response: {
          200: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: { type: "string" },
              },
              subjects: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement permissions reference logic
      const referenceData = {
        actions: ["create", "read", "update", "delete", "manage"],
        subjects: ["User", "Project", "Task", "org"],
        roles: ["owner", "admin", "member", "viewer"],
      }

      return referenceData
    }
  )

  // Get roles for an org (requires authentication)
  app.get(
    "/orgs/:orgId/roles",
    {
      preHandler: [requireAuth],
      schema: {
        description: "Get roles for an org",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                permissions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      subject: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { orgId } = request.params as { orgId: string }
      return await getRolesWithPermissions(request, orgId)
    }
  )

  // Create new role (requires authentication and create permission)
  app.post(
    "/orgs/:orgId/roles",
    {
      preHandler: [
        requireAuth,
        async (request, reply) => {
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await requireOrgPermission(db, "create", "Role")(request, reply)
        },
      ],
      schema: {
        description: "Create a new role",
        tags: ["permissions"],
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
            name: { type: "string", minLength: 1 },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  subject: { type: "string" },
                },
                required: ["action", "subject"],
              },
            },
          },
          required: ["name", "permissions"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { orgId } = request.params as { orgId: string }
      const { name, permissions } = request.body as {
        name: string
        permissions: any[]
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
        "Role",
        undefined,
        orgId,
        { name, permissions }
      )

      const newRole = await createRoleWithPermissions(
        request,
        orgId,
        name,
        permissions
      )
      return {
        id: newRole.id.toString(),
        name: newRole.name,
        message: "Role created successfully",
      }
    }
  )

  // Update role (requires authentication and update permission)
  app.put(
    "/orgs/:orgId/roles/:roleId",
    {
      preHandler: [
        requireAuth,
        async (request, reply) => {
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await requireOrgPermission(db, "update", "Role")(request, reply)
        },
      ],
      schema: {
        description: "Update a role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  subject: { type: "string" },
                },
                required: ["action", "subject"],
              },
            },
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
      const { orgId, roleId } = request.params as {
        orgId: string
        roleId: string
      }
      const body = request.body as any
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
        "UPDATE",
        "Role",
        roleId,
        orgId,
        body
      )

      const { name, permissions } = body
      await updateRoleWithPermissions(
        request,
        parseInt(roleId, 10),
        name,
        permissions
      )
      return { message: "Role updated successfully" }
    }
  )

  // Delete role (requires authentication and delete permission)
  app.delete(
    "/orgs/:orgId/roles/:roleId",
    {
      preHandler: [
        requireAuth,
        async (request, reply) => {
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await requireOrgPermission(db, "delete", "Role")(request, reply)
        },
      ],
      schema: {
        description: "Delete a role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
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
      const { orgId, roleId } = request.params as {
        orgId: string
        roleId: string
      }
      const _user = request.user!
      const db = request.context?.db

      if (!db) {
        throw new Error("Database not initialized")
      }

      // Setup audit logging for this request
      const { auditLogger } = createAuditMiddleware(db)

      // Log the mutation
      await auditLogger.logMutation(request, "DELETE", "Role", roleId, orgId)

      await deleteRoleById(request, parseInt(roleId, 10))
      return { message: "Role deleted successfully" }
    }
  )

  // Add permission to role (requires authentication and update permission)
  app.post(
    "/orgs/:orgId/roles/:roleId/permissions",
    {
      preHandler: [
        requireAuth,
        async (request, reply) => {
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await requireOrgPermission(db, "update", "Role")(request, reply)
        },
      ],
      schema: {
        description: "Add permission to role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            action: { type: "string" },
            subject: { type: "string" },
          },
          required: ["action", "subject"],
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
      const { orgId, roleId } = request.params as {
        orgId: string
        roleId: string
      }
      const permission = request.body as { action: string; subject: string }
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
        "UPDATE",
        "RolePermission",
        roleId,
        orgId,
        { action: "add", permission }
      )

      await addPermissionToRole(
        request,
        parseInt(roleId, 10),
        permission.action,
        permission.subject
      )
      return { message: "Permission added to role successfully" }
    }
  )

  // Remove permission from role (requires authentication and update permission)
  app.delete(
    "/orgs/:orgId/roles/:roleId/permissions",
    {
      preHandler: [
        requireAuth,
        async (request, reply) => {
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await requireOrgPermission(db, "update", "Role")(request, reply)
        },
      ],
      schema: {
        description: "Remove permission from role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            action: { type: "string" },
            subject: { type: "string" },
          },
          required: ["action", "subject"],
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
      const { orgId, roleId } = request.params as {
        orgId: string
        roleId: string
      }
      const permission = request.body as { action: string; subject: string }
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
        "UPDATE",
        "RolePermission",
        roleId,
        orgId,
        { action: "remove", permission }
      )

      await removePermissionFromRole(
        request,
        parseInt(roleId, 10),
        permission.action,
        permission.subject
      )
      return { message: "Permission removed from role successfully" }
    }
  )
}
