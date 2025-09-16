import { createAuditMiddleware } from "@incmix-api/utils/audit"
import type { Database } from "@incmix-api/utils/db-schema"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
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

export const setupPermissionRoutes = async (app: FastifyInstance) => {
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
                description: "Available actions in the permission system",
              },
              subjects: {
                type: "array",
                items: { type: "string" },
                description:
                  "Available subjects (resources) in the permission system",
              },
              roles: {
                type: "array",
                items: { type: "string" },
                description: "Available user roles",
              },
              roleDefinitions: {
                type: "object",
                description:
                  "Detailed definitions of each role with capabilities",
                additionalProperties: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    level: { type: "number" },
                    capabilities: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
              actionDescriptions: {
                type: "object",
                description: "Descriptions of what each action allows",
                additionalProperties: { type: "string" },
              },
              subjectDescriptions: {
                type: "object",
                description: "Descriptions of what each subject represents",
                additionalProperties: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // Import the actual permission constants from the utils package
      const { actions, subjects } = await import("@incmix/utils/types")
      const { UserRoles, USER_ROLES } = await import("@incmix/utils/types")

      // Build comprehensive reference data from the actual system constants
      const referenceData = {
        actions: [...actions],
        subjects: [...subjects],
        roles: USER_ROLES.map((role) =>
          role.replace("ROLE_", "").toLowerCase()
        ),
        roleDefinitions: {
          owner: {
            description: "Full access to organization and all resources",
            level: 1,
            capabilities: [
              "manage all resources",
              "billing access",
              "member management",
            ],
          },
          admin: {
            description: "Administrative access to organization resources",
            level: 2,
            capabilities: [
              "create/edit/delete resources",
              "member management",
              "project oversight",
            ],
          },
          editor: {
            description: "Can create and edit content",
            level: 3,
            capabilities: ["create/edit resources", "project participation"],
          },
          member: {
            description: "Basic access to assigned resources",
            level: 4,
            capabilities: [
              "read assigned resources",
              "comment and collaborate",
            ],
          },
          viewer: {
            description: "Read-only access to permitted resources",
            level: 5,
            capabilities: ["read permitted resources"],
          },
          commenter: {
            description: "Can view and comment on permitted resources",
            level: 6,
            capabilities: ["read and comment on permitted resources"],
          },
          guest: {
            description: "Limited temporary access",
            level: 7,
            capabilities: ["read specific shared resources"],
          },
        },
        actionDescriptions: {
          manage: "Full control over the resource including all other actions",
          create: "Create new instances of the resource",
          read: "View and access the resource",
          update: "Modify existing instances of the resource",
          delete: "Remove instances of the resource",
        },
        subjectDescriptions: {
          all: "All resources in the system",
          Organisation: "Organization-level settings and configuration",
          Member: "Organization members and their roles",
          Project: "Projects within the organization",
          Task: "Tasks within projects",
          Comment: "Comments on various resources",
          Document: "Documents and files",
          Folder: "Folder organization and structure",
          File: "Individual files and attachments",
          ProjectMember: "Project-specific member roles and permissions",
          Role: "Custom roles and permission sets",
          Permission: "Individual permission definitions",
        },
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
        name,
        "description",
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
        Number(roleId),
        name,
        "description",
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

      await deleteRoleById(request, Number(roleId))
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

      // First find the permission by action and subject
      const dbLookup = getDb<Database>(request)
      const foundPermission = await dbLookup
        .selectFrom("permissions")
        .selectAll()
        .where("action", "=", permission.action as any)
        .where("resourceType", "=", permission.subject as any)
        .executeTakeFirst()

      if (!foundPermission) {
        throw new Error(
          `Permission not found for action: ${permission.action} and subject: ${permission.subject}`
        )
      }

      await addPermissionToRole(request, Number(roleId), foundPermission.id)
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

      // First find the permission by action and subject
      const dbRemove = getDb<Database>(request)
      const foundPermission = await dbRemove
        .selectFrom("permissions")
        .selectAll()
        .where("action", "=", permission.action as any)
        .where("resourceType", "=", permission.subject as any)
        .executeTakeFirst()

      if (!foundPermission) {
        throw new Error(
          `Permission not found for action: ${permission.action} and subject: ${permission.subject}`
        )
      }

      await removePermissionFromRole(
        request,
        Number(roleId),
        foundPermission.id
      )
      return { message: "Permission removed from role successfully" }
    }
  )
}
