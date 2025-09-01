import { OpenAPIHono } from "@hono/zod-openapi"
import type { UserRole } from "@incmix/utils/types"
import { actions, subjects, UserRoles } from "@incmix/utils/types"
import { ERROR_BAD_REQUEST, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  NotFoundError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { apiReference } from "@scalar/hono-api-reference"
import { ERROR_MEMBER_UPDATE_FAIL, ERROR_NO_ROLES } from "@/lib/constants"
import {
  deletePermission,
  deleteRoleById,
  ensureAtLeastOneOwner,
  findAllRoles,
  findOrganisationByHandle,
  findOrgMemberById,
  findPermissionBySubjectAndAction,
  findRoleByName,
  insertPermission,
  insertRole,
  updateRoleById,
} from "@/lib/db"
import { throwUnlessUserCan } from "@/lib/helper"
import {
  addNewRole,
  deleteRole,
  updateMemberRole,
  updateRole,
} from "@/routes/roles/openapi"
import type { HonoApp } from "@/types"
import { getRolesPermissions, updatePermissions } from "./openapi"

const permissionRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

// Setup OpenAPI documentation
permissionRoutes.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Permissions API",
    description:
      "API for managing roles and permissions within organizations. Auth via cookieAuth (session).",
  },
  tags: [
    {
      name: "Permissions",
      description: "Role and permission management operations",
    },
  ],
})

permissionRoutes.get(
  "/reference",
  apiReference({
    spec: {
      url: "/api/org/permissions/openapi.json",
    },
  })
)

permissionRoutes.openAPIRegistry.registerComponent(
  "securitySchemes",
  "cookieAuth",
  {
    type: "apiKey",
    in: "cookie",
    name: "session",
  }
)

permissionRoutes.openapi(getRolesPermissions, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { orgId } = c.req.valid("query")

    await throwUnlessUserCan(c, "update", "Role", orgId)

    const roles = await findAllRoles(c, orgId)

    const rbac = c.get("rbac")

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

    return c.json(
      {
        roles,
        permissions: enhancedPermissions,
      },
      200
    )
  } catch (error) {
    return await processError<typeof getRolesPermissions>(c, error, [
      "{{ default }}",
      "get-roles-permissions",
    ])
  }
})

permissionRoutes.openapi(updatePermissions, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { orgId } = c.req.valid("param")
    await throwUnlessUserCan(c, "update", "Role", orgId)

    const { updates } = c.req.valid("json")

    if (updates.length === 0) {
      const msg = await t.text(ERROR_BAD_REQUEST)
      throw new UnprocessableEntityError(msg)
    }
    await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        for (const update of updates) {
          const { subject, action, roleId, allowed } = update

          // Check existing role-permission join
          const joined = await findPermissionBySubjectAndAction(
            c,
            subject,
            action,
            roleId,
            tx
          )

          if (allowed) {
            // Get or create permission by (subject, action)
            const existingPerm = await tx
              .selectFrom("permissions")
              .selectAll()
              .where("resourceType", "=", subject)
              .where("action", "=", action)
              .executeTakeFirst()

            const perm =
              existingPerm ??
              (await insertPermission(
                c,
                {
                  resourceType: subject,
                  action,
                  conditions: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  name: `${subject} ${action}`,
                },
                tx
              ))

            if (!perm?.id) {
              throw new ServerError("Failed to create permission")
            }

            // Ensure rolePermissions link exists
            if (!joined) {
              await tx
                .insertInto("rolePermissions")
                .values({
                  roleId,
                  permissionId: perm.id,
                  createdAt: new Date().toISOString(),
                })
                .executeTakeFirst()
            }
          } else if (joined) {
            // Remove role-permission link
            const deleted = await deletePermission(c, joined.permissionId, roleId, tx)
            if (!deleted) {
              throw new ServerError("Failed to delete permission mapping")
            }
          }
        }
      })

    return c.json({ message: "Permissions updated" }, 200)
  } catch (error) {
    return await processError<typeof updatePermissions>(c, error, [
      "{{ default }}",
      "update-permission",
    ])
  }
})

// Add roles routes for OpenAPI docs only (placeholder implementations)
permissionRoutes.openapi(addNewRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { orgId } = c.req.valid("query")
    await throwUnlessUserCan(c, "create", "Role", orgId)

    const { name, description, scope } = c.req.valid("json")

    const newRole = await insertRole(c, {
      name,
      description,
      scope,
      organizationId: orgId,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (!newRole) {
      throw new ServerError("Failed to create role")
    }

    return c.json({ message: "Role created successfully" }, 201)
  } catch (error) {
    return await processError<typeof addNewRole>(c, error, [
      "{{ default }}",
      "add-new-role",
    ])
  }
})
permissionRoutes.openapi(updateRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { orgId } = c.req.valid("query")
    const { id } = c.req.valid("param")
    await throwUnlessUserCan(c, "update", "Role", orgId)

    const updateData = c.req.valid("json")

    const result = await updateRoleById(c, updateData, id)

    if (Number(result.numUpdatedRows) === 0) {
      throw new NotFoundError("Role not found")
    }

    return c.json({ message: "Role updated successfully" }, 200)
  } catch (error) {
    return await processError<typeof updateRole>(c, error, [
      "{{ default }}",
      "update-role",
    ])
  }
})
permissionRoutes.openapi(deleteRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { orgId } = c.req.valid("query")
    const { id } = c.req.valid("param")
    await throwUnlessUserCan(c, "delete", "Role", orgId)

    const result = await deleteRoleById(c, id)
    if (!result) {
      throw new NotFoundError("Role not found")
    }

    return c.json({ message: "Role deleted successfully" }, 200)
  } catch (error) {
    return await processError<typeof deleteRole>(c, error, [
      "{{ default }}",
      "delete-role",
    ])
  }
})

permissionRoutes.openapi(updateMemberRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { role: newRole, userId } = c.req.valid("json")

    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan(c, "update", "Member", org.id)

    const member = await findOrgMemberById(c, userId, org.id)

    if (
      member.role === UserRoles.ROLE_OWNER &&
      newRole !== UserRoles.ROLE_OWNER
    ) {
      await ensureAtLeastOneOwner(c, org.id, [userId], "update")
    }

    const dbRole = await findRoleByName(c, newRole as UserRole)
    if (!dbRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const updated = await c
      .get("db")
      .updateTable("members")
      .set({ roleId: dbRole.id })
      .where((eb) =>
        eb.and([eb("orgId", "=", org.id), eb("userId", "=", userId)])
      )
      .returningAll()
      .executeTakeFirst()

    if (!updated) {
      const msg = await t.text(ERROR_MEMBER_UPDATE_FAIL)
      throw new ServerError(msg)
    }

    return c.json({ message: "Member role updated successfully" }, 200)
  } catch (error) {
    return await processError<typeof updateMemberRole>(c, error, [
      "{{ default }}",
      "update-member-role",
    ])
  }
})

const permissionsReferenceRoutes = new OpenAPIHono<HonoApp>()

// Setup OpenAPI documentation for permissions (must be before parameterized routes)
permissionsReferenceRoutes.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Permissions API",
    description:
      "API for managing roles and permissions within organizations. Auth via cookieAuth (session).",
  },
  tags: [
    {
      name: "Permissions",
      description: "Role and permission management operations",
    },
  ],
})

permissionsReferenceRoutes.get(
  "/",
  apiReference({
    spec: {
      url: "/api/org/permissions/reference/openapi.json",
    },
  })
)

// Note: /openapi.json is automatically created by permissionsReferenceRoutes.doc() above

permissionsReferenceRoutes.openAPIRegistry.registerComponent(
  "securitySchemes",
  "cookieAuth",
  {
    type: "apiKey",
    in: "cookie",
    name: "session",
  }
)

// Add the permissions and roles routes for OpenAPI docs only - these reference the same handlers as above
permissionsReferenceRoutes.openapi(getRolesPermissions, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})
permissionsReferenceRoutes.openapi(updatePermissions, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})
permissionsReferenceRoutes.openapi(addNewRole, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})
permissionsReferenceRoutes.openapi(updateRole, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})
permissionsReferenceRoutes.openapi(deleteRole, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})
permissionsReferenceRoutes.openapi(updateMemberRole, (c) => {
  return c.json(
    { message: "Use /api/org/permissions endpoint for actual implementation" },
    501 as any
  )
})

export { permissionsReferenceRoutes }
export default permissionRoutes
