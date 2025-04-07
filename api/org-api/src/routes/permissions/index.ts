import {
  db,
  deletePermission,
  findAllPermissions,
  findAllRoles,
  findPermissionBySubjectAndAction,
  insertPermission,
  updatePermission,
} from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ERROR_BAD_REQUEST,
  ERROR_CASL_FORBIDDEN,
  ERROR_UNAUTHORIZED,
} from "@incmix-api/utils"
import {
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { UserRoles, actions, subjects } from "@incmix/utils/types"
import { getRolesPermissions, updatePermissions } from "./openapi"

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

    const roles = await findAllRoles()

    const permissions = await findAllPermissions()

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

    const { updates } = c.req.valid("json")

    if (updates.length === 0) {
      const msg = await t.text(ERROR_BAD_REQUEST)
      throw new UnprocessableEntityError(msg)
    }
    await db.transaction().execute(async (tx) => {
      for (const update of updates) {
        const { subject, action, roleId, allowed } = update

        const permission = await findPermissionBySubjectAndAction(
          subject,
          action,
          roleId,
          tx
        )

        if (!permission && allowed) {
          const newPermission = await insertPermission(
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
          const deleted = await deletePermission(permission.id, tx)
          if (!deleted) {
            throw new ServerError("Failed to Update permission")
          }
        }

        if (permission && allowed) {
          const updated = await updatePermission(permission, permission.id, tx)
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

export default permissionRoutes
