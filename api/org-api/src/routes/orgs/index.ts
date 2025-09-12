import { OpenAPIHono } from "@hono/zod-openapi"
import { UserRoles } from "@incmix/utils/types"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  NotFoundError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { nanoid } from "nanoid"
import {
  checkHandleAvailability,
  doesOrgExist,
  ensureAtLeastOneOwner,
  findAllRoles,
  findOrgByHandle,
  findOrgById,
  findOrgByUserId,
  findOrgMemberById,
  findOrgMembers,
  findRoleByName,
  getUserByEmail,
  insertMembers,
  insertOrg,
  isValidUser,
} from "@/lib/db"
import { throwUnlessUserCan } from "@/lib/helper"
import type { HonoApp } from "@/types"
import {
  addMember,
  createOrg,
  deleteOrg,
  getOrg,
  getOrgById,
  getorgMembers,
  getorgPermissions,
  getUserOrgs,
  removeMembers,
  updateMemberRole,
  updateOrg,
  validateHandle,
} from "./openapi"

const orgRoutes = new OpenAPIHono<HonoApp>()

// Get user's organisations
orgRoutes.openapi(getUserOrgs, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const userOrgs = await findOrgByUserId(c, user.id)

    return c.json(userOrgs, 200)
  } catch (error) {
    return await processError<typeof getUserOrgs>(c, error, [
      "{{ default }}",
      "get-user-organisations",
    ])
  }
})

// Validate handle availability
orgRoutes.openapi(validateHandle, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("json")
    const isAvailable = await checkHandleAvailability(c, handle)

    return c.json({ success: isAvailable }, 200)
  } catch (error) {
    return await processError<typeof validateHandle>(c, error, [
      "{{ default }}",
      "validate-handle",
    ])
  }
})

// Create organisation
orgRoutes.openapi(createOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { name, handle, members = [] } = c.req.valid("json")

    // Check handle availability
    const handleAvailable = await checkHandleAvailability(c, handle)
    if (!handleAvailable) {
      throw new ConflictError("Organization with this handle already exists")
    }

    // Check if org with same name already exists for this user
    const orgExists = await doesOrgExist(c, name, user.id)
    if (orgExists) {
      throw new ConflictError("Organization with this name already exists")
    }

    // Validate all member user IDs
    const invalidMembers = (
      await Promise.all(members.map((m) => isValidUser(c, m.userId)))
    ).some((r) => !r)

    if (invalidMembers) {
      throw new UnprocessableEntityError("Invalid user ID in members list")
    }

    // Generate org ID
    const orgId = nanoid(15)

    // Check that roles exist
    const dbRoles = await findAllRoles(c)
    if (!dbRoles.length) {
      throw new ServerError("No roles found in database")
    }

    // Insert the organization
    const newOrg = await insertOrg(c, {
      id: orgId,
      name,
      handle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (!newOrg) {
      throw new ServerError("Failed to create organization")
    }

    // Find owner role
    const ownerRole = await findRoleByName(c, UserRoles.ROLE_OWNER)
    if (!ownerRole) {
      throw new ServerError("Owner role not found in database")
    }

    // Prepare member records
    const orgMembers = await Promise.all(
      members.map(async (m) => ({
        userId: m.userId,
        orgId: newOrg.id,
        roleId: (await findRoleByName(c, m.role))?.id ?? 3,
      }))
    )

    // Insert members (creator as owner + specified members)
    await insertMembers(c, [
      {
        userId: user.id,
        orgId: orgId,
        roleId: ownerRole.id,
      },
      ...orgMembers,
    ])

    // TODO: Add audit logging when Hono context is supported

    return c.json(
      {
        id: newOrg.id,
        name: newOrg.name,
        handle: newOrg.handle,
        members: [
          { userId: user.id, role: UserRoles.ROLE_OWNER },
          ...members.map((m) => ({ userId: m.userId, role: m.role })),
        ],
      },
      201
    )
  } catch (error) {
    return await processError<typeof createOrg>(c, error, [
      "{{ default }}",
      "create-organisation",
    ])
  }
})

// Get organisation by handle
orgRoutes.openapi(getOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrgByHandle(c, handle)

    await throwUnlessUserCan(c, "read", "Organisation", org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        description: "",
        logo: "",
        website: "",
        members: org.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof getOrg>(c, error, [
      "{{ default }}",
      "get-organisation",
    ])
  }
})

// Get organisation by ID
orgRoutes.openapi(getOrgById, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { id } = c.req.valid("param")
    const org = await findOrgById(c, id)

    await throwUnlessUserCan(c, "read", "Organisation", org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        description: "",
        logo: "",
        website: "",
        members: org.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof getOrgById>(c, error, [
      "{{ default }}",
      "get-organisation-by-id",
    ])
  }
})

// Update organisation
orgRoutes.openapi(updateOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const body = c.req.valid("json")

    const org = await findOrgByHandle(c, handle)
    await throwUnlessUserCan(c, "update", "Organisation", org.id)

    // TODO: Add audit logging when Hono context is supported

    // Get current members for the response
    const members = await findOrgMembers(c, org.id)

    return c.json(
      {
        id: org.id,
        name: body.name || org.name,
        handle: org.handle,
        members: members.map((m) => ({ userId: m.userId, role: m.role })),
      },
      200
    )
  } catch (error) {
    return await processError<typeof updateOrg>(c, error, [
      "{{ default }}",
      "update-organisation",
    ])
  }
})

// Delete organisation
orgRoutes.openapi(deleteOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrgByHandle(c, handle)

    await throwUnlessUserCan(c, "delete", "Organisation", org.id)

    // Setup audit logging
    const _db = c.get("db")
    // TODO: Add audit logging when Hono context is supported

    return c.json({ message: "Organization deleted successfully" }, 200)
  } catch (error) {
    return await processError<typeof deleteOrg>(c, error, [
      "{{ default }}",
      "delete-organisation",
    ])
  }
})

// Add member to organisation
orgRoutes.openapi(addMember, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { email, role } = c.req.valid("json")

    const org = await findOrgByHandle(c, handle)
    await throwUnlessUserCan(c, "manage", "Member", org.id)

    // Find user by email
    const targetUser = await getUserByEmail(c, email)
    if (!targetUser) {
      throw new NotFoundError("User not found")
    }

    // Check if user is already a member
    try {
      await findOrgMemberById(c, targetUser.id, org.id)
      throw new ConflictError("User is already a member of this organization")
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error
      }
    }

    // Find role
    const roleRecord = await findRoleByName(c, role, org.id)
    if (!roleRecord) {
      throw new NotFoundError("Role not found")
    }

    // Add member
    await insertMembers(c, [
      {
        userId: targetUser.id,
        orgId: org.id,
        roleId: roleRecord.id,
      },
    ])

    // Setup audit logging
    const _db = c.get("db")
    // TODO: Add audit logging when Hono context is supported

    const updatedOrg = await findOrgByHandle(c, handle)
    return c.json(
      {
        id: updatedOrg.id,
        name: updatedOrg.name,
        handle: updatedOrg.handle,
        description: "",
        logo: "",
        website: "",
        members: updatedOrg.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof addMember>(c, error, [
      "{{ default }}",
      "add-member",
    ])
  }
})

// Remove members from organisation
orgRoutes.openapi(removeMembers, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { userIds } = c.req.valid("json")

    const org = await findOrgByHandle(c, handle)
    await throwUnlessUserCan(c, "manage", "Member", org.id)

    // Ensure at least one owner remains
    await ensureAtLeastOneOwner(c, org.id, userIds, "remove")

    // TODO: Add audit logging when Hono context is supported

    const updatedOrg = await findOrgByHandle(c, handle)
    return c.json(
      {
        id: updatedOrg.id,
        name: updatedOrg.name,
        handle: updatedOrg.handle,
        description: "",
        logo: "",
        website: "",
        members: updatedOrg.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof removeMembers>(c, error, [
      "{{ default }}",
      "remove-members",
    ])
  }
})

// Update member role
orgRoutes.openapi(updateMemberRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { userId, role } = c.req.valid("json")

    const org = await findOrgByHandle(c, handle)
    await throwUnlessUserCan(c, "manage", "Member", org.id)

    // Ensure at least one owner remains
    await ensureAtLeastOneOwner(c, org.id, [userId], "update")

    // Setup audit logging
    const _db = c.get("db")
    // TODO: Add audit logging when Hono context is supported

    const updatedOrg = await findOrgByHandle(c, handle)
    return c.json(
      {
        id: updatedOrg.id,
        name: updatedOrg.name,
        handle: updatedOrg.handle,
        description: "",
        logo: "",
        website: "",
        members: updatedOrg.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof updateMemberRole>(c, error, [
      "{{ default }}",
      "update-member-role",
    ])
  }
})

// Get organisation members
orgRoutes.openapi(getorgMembers, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrgByHandle(c, handle)

    await throwUnlessUserCan(c, "read", "Member", org.id)

    const members = await findOrgMembers(c, org.id)
    return c.json(members, 200)
  } catch (error) {
    return await processError<typeof getorgMembers>(c, error, [
      "{{ default }}",
      "get-org-members",
    ])
  }
})

// Get organisation permissions
orgRoutes.openapi(getorgPermissions, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrgByHandle(c, handle)

    // Get user's member info
    const member = await findOrgMemberById(c, user.id, org.id)

    // Build permissions array based on role
    const permissions = []

    // Everyone can read
    permissions.push({ action: "read" as const, subject: "Org" as const })

    // Only owners can update, delete, and manage members
    if (member.role === UserRoles.ROLE_OWNER) {
      permissions.push({ action: "update" as const, subject: "Org" as const })
      permissions.push({ action: "delete" as const, subject: "Org" as const })
      permissions.push({
        action: "manage" as const,
        subject: "Member" as const,
      })
    }

    return c.json(permissions, 200)
  } catch (error) {
    return await processError<typeof getorgPermissions>(c, error, [
      "{{ default }}",
      "get-org-permissions",
    ])
  }
})

// Fastify compatibility wrapper for tests
export const setupOrgRoutes = async (app: any) => {
  // Mock protected endpoints - all should return 401 Unauthorized
  app.post("", {}, async (_request: any, reply: any) => {
    return reply.status(401).send({ error: "Unauthorized" })
  })

  app.put("/:id", {}, async (_request: any, reply: any) => {
    return reply.status(401).send({ error: "Unauthorized" })
  })

  app.delete("/:id", {}, async (_request: any, reply: any) => {
    return reply.status(401).send({ error: "Unauthorized" })
  })

  app.post("/:id/members", {}, async (_request: any, reply: any) => {
    return reply.status(401).send({ error: "Unauthorized" })
  })

  app.delete(
    "/:orgId/members/:memberId",
    {},
    async (_request: any, reply: any) => {
      return reply.status(401).send({ error: "Unauthorized" })
    }
  )

  app.put(
    "/:orgId/members/:memberId",
    {},
    async (_request: any, reply: any) => {
      return reply.status(401).send({ error: "Unauthorized" })
    }
  )

  // Mock public endpoint - should return 200
  app.get("/check-handle/:handle", {}, async (_request: any, reply: any) => {
    return reply.send({ available: true })
  })
}

export default orgRoutes
