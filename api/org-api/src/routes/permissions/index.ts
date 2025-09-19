import { actions, subjects } from "@incmix/utils/types"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import { createAuditMiddleware } from "@incmix-api/utils/audit"
import type { Database } from "@incmix-api/utils/db-schema"
import { UnauthorizedError } from "@incmix-api/utils/errors"
import {
  getDb,
  useFastifyTranslation,
} from "@incmix-api/utils/fastify-bootstrap"
import { createRBACMiddleware } from "@incmix-api/utils/fastify-middleware"
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from "@incmix-api/utils/fastify-middleware/auth"
import type { FastifyInstance } from "fastify"
import { throwUnlessUserCan } from "@/lib/helper"
import {
  addPermissionToRole,
  createRoleWithPermissions,
  deleteRoleById,
  findAllRoles,
  getRolesWithPermissions,
  removePermissionFromRole,
  updateRoleWithPermissions,
} from "../../lib/db"

export const setupPermissionRoutes = async (app: FastifyInstance) => {
  // Setup authentication middleware
  const requireAuth = createAuthMiddleware()
  const optionalAuth = createOptionalAuthMiddleware()
  const requireRBAC = createRBACMiddleware()
  // Get all available permissions reference data (public endpoint)
  app.get(
    "/reference",
    {
      preHandler: [optionalAuth, requireRBAC],
      schema: {
        summary: "Get permissions reference data",
        tags: ["Permissions"],
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
      const { USER_ROLES } = await import("@incmix/utils/types")

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
      preHandler: [requireAuth, requireRBAC],
      schema: {
        summary: "Get roles for an org",
        tags: ["Permissions"],
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
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.params as { orgId: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "create", "Role", orgId)
        },
      ],
      schema: {
        summary: "Create a new role",
        tags: ["Permissions"],
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
      const user = request.user
      const db = request.context?.db

      if (!user) {
        throw new Error("User not authenticated")
      }

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
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.params as { orgId: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "update", "Role", orgId)
        },
      ],
      schema: {
        summary: "Update a role",
        tags: ["Permissions"],
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
      const user = request.user
      const db = request.context?.db

      if (!user) {
        throw new Error("User not authenticated")
      }

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
        body.description,
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
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.params as { orgId: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "delete", "Role", orgId)
        },
      ],
      schema: {
        summary: "Delete a role",
        tags: ["Permissions"],
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
      const user = request.user
      const db = request.context?.db

      if (!user) {
        throw new Error("User not authenticated")
      }

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
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.params as { orgId: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "update", "Role", orgId)
        },
      ],
      schema: {
        summary: "Add permission to role",
        tags: ["Permissions"],
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
      const user = request.user
      const db = request.context?.db

      if (!user) {
        throw new Error("User not authenticated")
      }

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
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.params as { orgId: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "update", "Role", orgId)
          await throwUnlessUserCan(request, "delete", "Permission", orgId)
        },
      ],
      schema: {
        summary: "Remove permission from role",
        tags: ["Permissions"],
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
      const user = request.user
      const db = request.context?.db

      if (!user) {
        throw new Error("User not authenticated")
      }

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

  app.get(
    "/",
    {
      preHandler: [
        requireAuth,
        requireRBAC,
        async (request, _reply) => {
          const { orgId } = request.query as { orgId?: string }
          const db = request.context?.db
          if (!db) {
            throw new Error("Database not initialized")
          }
          await throwUnlessUserCan(request, "read", "Permission", orgId)
          await throwUnlessUserCan(request, "read", "Role", orgId)
        },
      ],
      schema: {
        query: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string", nullable: true },
                    orgId: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                  required: ["id", "name", "createdAt", "updatedAt"],
                },
              },
              permissions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    subject: {
                      type: "string",
                      enum: [
                        "Organisation",
                        "Member",
                        "Project",
                        "Task",
                        "Comment",
                        "Document",
                        "Folder",
                        "File",
                        "ProjectMember",
                        "Role",
                        "Permission",
                      ],
                    },
                    action: {
                      type: "string",
                      enum: ["manage", "create", "read", "update", "delete"],
                    },
                  },
                  required: ["subject", "action"],
                  additionalProperties: {
                    type: "boolean",
                    description:
                      "Boolean flags for each role indicating if the role has this permission",
                  },
                },
              },
            },
            required: ["roles", "permissions"],
          },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
          403: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useFastifyTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { orgId } = request.query as { orgId?: string }

        await throwUnlessUserCan(request, "update", "Role", orgId)

        const roles = await findAllRoles(request, orgId)

        const rbac = request.context?.rbac

        if (!rbac) {
          throw new UnauthorizedError("RBAC not available")
        }

        const permissions = await rbac.getAllPermissions(orgId)
        const subjectActionCombinations = []
        for (const subject of subjects) {
          for (const action of actions) {
            subjectActionCombinations.push({
              subject,
              action,
            })
          }
        }
        // Create a map of role IDs to their names for easier lookup
        const roleMap = new Map(roles.map((role) => [role.id, role.name]))

        // Create a map to track which permissions are assigned to which roles
        const rolePermissionsMap = new Map()

        // Initialize the map with all subject-action combinations for each role
        for (const role of roles) {
          rolePermissionsMap.set(role.id, new Set())
        }

        // Populate the map with actual permissions
        for (const permission of permissions) {
          if (permission.role.id) {
            const permissionSet = rolePermissionsMap.get(permission.role.id)
            if (permissionSet) {
              const key = `${permission.subject}:${permission.action}`
              permissionSet.add(key)
            }
          }
        }
        // console.log(rolePermissionsMap)
        // Create a flat array of all permissions with role information
        const enhancedPermissions: Record<
          string,
          (typeof subjects)[number] | (typeof actions)[number] | boolean
        >[] = []

        // Process all subject-action combinations
        subjectActionCombinations.forEach(({ subject, action }) => {
          if (subject === "all") {
            return
          }

          const permissionObj: Record<
            string,
            (typeof subjects)[number] | (typeof actions)[number] | boolean
          > = {
            subject,
            action,
            ...Object.fromEntries(roles.map((role) => [role.name, false])),
          }

          // Add a boolean flag for each role
          for (const role of roles) {
            const roleName = roleMap.get(role.id) || role.name
            const permissionKey = `${subject}:${action}`
            // Check if this role has this specific permission
            const hasPermission =
              rolePermissionsMap.get(role.id)?.has(permissionKey) || false

            permissionObj[roleName] = hasPermission
          }

          enhancedPermissions.push(permissionObj)
        })

        return reply.code(200).send({
          roles,
          permissions: enhancedPermissions,
        })
      } catch (_error) {
        return reply.code(500).send({
          message: "Internal server error",
        })
      }
    }
  )

  // Get current user's permissions
  app.get(
    "/user",
    {
      preHandler: [requireAuth, requireRBAC],
      schema: {
        query: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              permissions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    subject: {
                      type: "string",
                      enum: [
                        "all",
                        "Organisation",
                        "Member",
                        "Project",
                        "Task",
                        "Comment",
                        "Document",
                        "Folder",
                        "File",
                        "ProjectMember",
                        "Role",
                        "Permission",
                      ],
                    },
                    action: {
                      type: "string",
                      enum: ["manage", "create", "read", "update", "delete"],
                    },
                  },
                  required: ["subject", "action"],
                },
              },
            },
            required: ["permissions"],
          },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useFastifyTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { orgId } = request.query as { orgId?: string }

        // If orgId is provided, get user's permissions within that org
        if (orgId) {
          const rbac = request.context?.rbac
          if (!rbac) {
            throw new UnauthorizedError("RBAC not available")
          }

          const orgPermissions = await rbac.getOrgPermissions(orgId)
          const permissions = orgPermissions?.permissions || []

          return reply.code(200).send({
            permissions,
          })
        }

        // If no orgId provided, check if user is super admin
        if (user.isSuperAdmin) {
          return reply.code(200).send({
            permissions: [
              {
                subject: "all",
                action: "manage",
              },
            ],
          })
        }

        // If not super admin and no orgId, return empty permissions
        return reply.code(200).send({
          permissions: [],
        })
      } catch (_error) {
        return reply.code(500).send({
          message: "Internal server error",
        })
      }
    }
  )
}
