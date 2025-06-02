import {
  deletePermission,
  deleteRoleById,
  findAllPermissions,
  findAllRoles,
  findPermissionBySubjectAndAction,
  findRoleById,
  findRoleByName,
  insertPermission,
  insertRole,
  updatePermission,
  updateRoleById,
} from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ERROR_BAD_REQUEST,
  ERROR_CASL_FORBIDDEN,
  ERROR_UNAUTHORIZED,
} from "@incmix-api/utils"
import {
  ConflictError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { UserRoles, actions, subjects } from "@incmix/utils/types"
import {
  addNewRole,
  deleteRole,
  getRolesPermissions,
  updatePermissions,
  updateRole,
} from "./openapi"

import {
  ERROR_ROLE_ALREADY_EXISTS,
  ERROR_ROLE_NOT_FOUND,
} from "@/lib/constants"
import type { PermissionsWithRole } from "./types"

const permissionRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

permissionRoutes.openapi(getRolesPermissions, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    // Create an array of all possible subject-action combinations
    const subjectActionCombinations = []
    for (const subject of subjects) {
      for (const action of actions) {
        subjectActionCombinations.push({
          subject,
          action,
        })
      }
    }

    const roles = await findAllRoles(c)

    const permissions = await findAllPermissions(c)

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
      if (permission.roleId) {
        const permissionSet = rolePermissionsMap.get(permission.roleId)
        if (permissionSet) {
          permissionSet.add(`${permission.subject}:${permission.action}`)
        }
      }
    }

    // Create a flat array of all permissions with role information
    const enhancedPermissions: PermissionsWithRole[] = []

    // Process all subject-action combinations
    subjectActionCombinations.forEach(({ subject, action }) => {
      if (subject === "all") {
        return
      }

      const permissionObj: PermissionsWithRole = {
        subject,
        action,
        [UserRoles.ROLE_ADMIN]: false,
        [UserRoles.ROLE_EDITOR]: false,
        [UserRoles.ROLE_VIEWER]: false,
        [UserRoles.ROLE_OWNER]: false,
        [UserRoles.ROLE_COMMENTER]: false,
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

    return c.json({ roles, permissions: enhancedPermissions }, 200)
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

    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

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

          const permission = await findPermissionBySubjectAndAction(
            c,
            subject,
            action,
            roleId,
            tx
          )

          if (!permission && allowed) {
            const newPermission = await insertPermission(
              c,
              {
                subject,
                action,
                roleId,
              },
              tx
            )

            if (!newPermission) {
              // const msg = await t.text(ERROR_PERMISSION_INSERT_FAIL)
              throw new ServerError("Failed to update permissions")
            }
          }

          if (permission && !allowed) {
            const deleted = await deletePermission(c, permission.id, tx)
            if (!deleted) {
              throw new ServerError("Failed to Update permission")
            }
          }

          if (permission && allowed) {
            const updated = await updatePermission(
              c,
              permission,
              permission.id,
              tx
            )
            if (!updated) {
              throw new ServerError("Failed to update permission")
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

permissionRoutes.openapi(addNewRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const { name } = c.req.valid("json")

    const existingRole = await findRoleByName(c, name)

    if (existingRole) {
      const msg = await t.text(ERROR_ROLE_ALREADY_EXISTS)
      throw new ConflictError(msg)
    }

    const newRole = await insertRole(c, { name })

    if (!newRole) {
      throw new ServerError("Failed to add new role")
    }

    return c.json({ message: "Role added" }, 201)
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
    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const { name, id } = c.req.valid("json")

    const existingRole = await findRoleById(c, id)

    if (!existingRole) {
      const msg = await t.text(ERROR_ROLE_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const updatedRole = await updateRoleById(c, { name }, existingRole.id)

    if (!updatedRole) {
      throw new ServerError("Failed to update role")
    }

    return c.json({ message: "Role updated" }, 200)
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
    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const { id } = c.req.valid("param")

    const deletedRole = await deleteRoleById(c, id)

    if (!deletedRole) {
      throw new ServerError("Failed to delete role")
    }

    return c.json({ message: "Role deleted" }, 200)
  } catch (error) {
    return await processError<typeof deleteRole>(c, error, [
      "{{ default }}",
      "delete-role",
    ])
  }
})

export default permissionRoutes
