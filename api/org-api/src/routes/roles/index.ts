import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  NotFoundError,
  UnauthorizedError,
  processError,
} from "@incmix-api/utils/errors"

import {
  ERROR_ROLE_ALREADY_EXISTS,
  ERROR_ROLE_NOT_FOUND,
} from "@/lib/constants"
import {
  deleteRoleById,
  findRoleByName,
  insertRole,
  updateRoleById,
} from "@/lib/db"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import { ConflictError, ServerError } from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { addNewRole, deleteRole, updateRole } from "./openapi"
import { findRoleById } from "@/lib/db"

const rolesRoutes = new OpenAPIHono<HonoApp>()
rolesRoutes.openapi(addNewRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { name, description, scope } = c.req.valid("json")
    const { orgId } = c.req.valid("param")

    const existingRole = await findRoleByName(c, name)

    if (existingRole) {
      const msg = await t.text(ERROR_ROLE_ALREADY_EXISTS)
      throw new ConflictError(msg)
    }

    const newRole = await insertRole(c, {
      name,
      description,
      scope,
      isSystemRole: false,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

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
rolesRoutes.openapi(updateRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { name, description, scope } = c.req.valid("json")
    const { id } = c.req.valid("param")

    const existingRole = await findRoleById(c, id)

    if (!existingRole) {
      const msg = await t.text(ERROR_ROLE_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const updatedRole = await updateRoleById(
      c,
      {
        name,
        description,
        scope,
      },
      existingRole.id
    )

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

rolesRoutes.openapi(deleteRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
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
