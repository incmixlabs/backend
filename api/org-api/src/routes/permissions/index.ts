import {
  deletePermission,
  findAllRoles,
  findPermissionBySubjectAndAction,
  insertPermission,
  updatePermission,
} from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_BAD_REQUEST, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { actions, subjects } from "@incmix/utils/types"
import { getRolesPermissions, updatePermissions } from "./openapi"

import { throwUnlessUserCan } from "@/lib/helper"

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

    const { orgId } = c.req.valid("param")
    await throwUnlessUserCan(c, "read", "Role", orgId)

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

    const roles = await findAllRoles(c, orgId)

    const rbac = c.get("rbac")

    const orgPermissions = await rbac.getOrgPermissions(orgId)
    const projectPermissions = await rbac.getProjectPermissions(orgId)
    // Create a map of role IDs to their names for easier lookup
    // const combinedPermissions = [
    //   ...(orgPermissions?.permissions || []),
    //   ...(projectPermissions?.permissions || []),
    // ]

    return c.json(
      {
        roles,
        orgPermissions: orgPermissions?.permissions || [],
        projectPermissions: projectPermissions?.permissions || [],
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
                resourceType: subject,
                action,
                condition: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                name: `${subject} ${action}`,
              },
              tx
            )

            if (!newPermission) {
              // const msg = await t.text(ERROR_PERMISSION_INSERT_FAIL)
              throw new ServerError("Failed to update permissions")
            }
          }

          if (permission && !allowed) {
            const deleted = await deletePermission(c, permission.id, roleId, tx)
            if (!deleted) {
              throw new ServerError("Failed to Update permission")
            }
          }

          if (permission && allowed) {
            const updated = await updatePermission(
              c,
              {
                ...permission,
                condition: null,
              },
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

export default permissionRoutes
