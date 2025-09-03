import {
  ERROR_INVALID_USER,
  ERROR_MEMBER_EXIST,
  ERROR_MEMBER_INSERT_FAIL,
  ERROR_NO_ROLES,
  ERROR_ORG_CREATE_FAIL,
  ERROR_ORG_DELETE_FAIL,
  ERROR_ORG_EXIST,
  ERROR_ORG_UPDATE_FAIL,
  ORG_DELETE_SUCCESS,
} from "@/lib/constants"
import {
  checkHandleAvailability,
  doesOrgExist,
  ensureAtLeastOneOwner,
  findAllRoles,
  findOrgByHandle,
  findOrgById,
  findOrgByUserId,
  findOrgMembers,
  findRoleByName,
  getUserByEmail,
  getUserById,
  insertMembers,
  insertOrg,
  isValidUser,
} from "@/lib/db"
import { throwUnlessUserCan } from "@/lib/helper"
import {
  addMember,
  createOrg,
  deleteOrg,
  getOrg,
  getOrgById,
  getOrganizationMembers,
  getOrganizationPermissions,
  getUserOrgs,
  removeMembers,
  updateOrg,
  validateHandle,
} from "@/routes/orgs/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { UserRole } from "@incmix/utils/types"
import { UserRoles } from "@incmix/utils/types"
import { nanoid } from "nanoid"

const orgRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

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

    await throwUnlessUserCan(c, "read", "Org" as any, org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        members: org.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof getOrg>(c, error, [
      "{{ default }}",
      "get-org",
    ])
  }
})
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

    await throwUnlessUserCan(c, "read", "Org" as any, org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        members: org.members,
      },
      200
    )
  } catch (error) {
    return await processError<typeof getOrg>(c, error, [
      "{{ default }}",
      "get-org-by-id",
    ])
  }
})

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
      "get-user-orgs",
    ])
  }
})

orgRoutes.openapi(validateHandle, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("json")
    const handleExists = await checkHandleAvailability(c, handle)

    return c.json(
      {
        success: handleExists,
      },
      200
    )
  } catch (error) {
    return await processError<typeof validateHandle>(c, error, [
      "{{ default }}",
      "validate-handle",
    ])
  }
})

orgRoutes.openapi(createOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { members, name, handle } = c.req.valid("json")

    const handleAvailable = await checkHandleAvailability(c, handle)
    if (!handleAvailable) {
      const msg = await t.text(ERROR_ORG_EXIST)
      throw new ConflictError(msg)
    }

    const orgExists = await doesOrgExist(c, name, user.id)

    if (orgExists) {
      const msg = await t.text(ERROR_ORG_EXIST)
      throw new ConflictError(msg)
    }

    const invalidMembers = (
      await Promise.all(members.map((m) => isValidUser(c, m.userId as string)))
    ).some((r) => !r)

    if (invalidMembers) {
      const msg = await t.text(ERROR_INVALID_USER)
      throw new UnprocessableEntityError(msg)
    }

    const orgId = nanoid(15)
    const dbRoles = await findAllRoles(c)

    if (!dbRoles.length) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const newOrg = await insertOrg(c, {
      id: orgId,
      name,
      handle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (!newOrg) {
      const msg = await t.text(ERROR_ORG_CREATE_FAIL)
      throw new ServerError(msg)
    }

    const ownerRole = await findRoleByName(c, UserRoles.ROLE_OWNER)
    if (!ownerRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const orgMembers = await Promise.all(
      members.map(async (m) => ({
        userId: m.userId as string,
        orgId: newOrg.id,
        roleId: (await findRoleByName(c, m.role as UserRole))?.id ?? 3,
      }))
    )

    await insertMembers(c, [
      {
        userId: user.id,
        orgId: orgId,
        roleId: ownerRole.id,
      },
      ...orgMembers,
    ])

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
      "create-org",
    ])
  }
})

orgRoutes.openapi(addMember, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { role, email } = c.req.valid("json")

    const org = await findOrgById(c, handle)

    await throwUnlessUserCan(c, "create", "Member", org.id)

    const existingUser = await getUserByEmail(c, email)
    if (!existingUser) {
      const msg = await t.text(ERROR_INVALID_USER)
      throw new UnprocessableEntityError(msg)
    }
    const userId = existingUser.id

    const isMember = await c.get("rbac").isOrgMember(org.id)
    if (isMember) {
      const msg = await t.text(ERROR_MEMBER_EXIST)
      throw new ConflictError(msg)
    }

    const dbRole = await findRoleByName(c, role)
    if (!dbRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const [newMember] = await insertMembers(c, [
      { userId, orgId: org.id, roleId: dbRole.id },
    ])

    if (!newMember) {
      const msg = await t.text(ERROR_MEMBER_INSERT_FAIL)
      throw new ServerError(msg)
    }

    const members = await findOrgMembers(c, org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        members: members.map((m) => ({ userId: m.userId, role: m.role })),
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

orgRoutes.openapi(updateOrg, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")

    const { name } = c.req.valid("json")
    const org = await findOrgById(c, handle)

    await throwUnlessUserCan(c, "update", "Org" as any, org.id)

    const orgExists = await doesOrgExist(c, name, user.id)

    if (orgExists) {
      const msg = await t.text(ERROR_ORG_EXIST)
      throw new ConflictError(msg)
    }

    const updatedOrg = await c
      .get("db")
      .updateTable("orgs")
      .set({ name: name })
      .where("id", "=", org.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedOrg) {
      const msg = await t.text(ERROR_ORG_UPDATE_FAIL)
      throw new ServerError(msg)
    }

    const members = await findOrgMembers(c, org.id)

    const responseData = {
      id: org.id,
      name: name,
      handle: org.handle,
      members: members.map((m) => ({ userId: m.userId, role: m.role })),
    }
    return c.json(responseData, 200)
  } catch (error) {
    return await processError<typeof updateOrg>(c, error, [
      "{{ default }}",
      "update-org",
    ])
  }
})

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

    await throwUnlessUserCan(c, "delete", "Org" as any, org.id)

    const deletedMembers = await c
      .get("db")
      .deleteFrom("members")
      .where("orgId", "=", org.id)
      .returningAll()
      .execute()

    if (!deletedMembers.length) {
      const msg = await t.text(ERROR_ORG_DELETE_FAIL)
      throw new ServerError(msg)
    }

    const deletedOrg = await c
      .get("db")
      .deleteFrom("orgs")
      .where("id", "=", org.id)
      .returningAll()
      .executeTakeFirst()

    if (!deletedOrg) {
      const msg = await t.text(ERROR_ORG_DELETE_FAIL)
      throw new ServerError(msg)
    }

    const msg = await t.text(ORG_DELETE_SUCCESS)
    return c.json(
      {
        message: msg,
      },
      200
    )
  } catch (error) {
    return await processError<typeof deleteOrg>(c, error, [
      "{{ default }}",
      "delete-org",
    ])
  }
})

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

    const org = await findOrgById(c, handle)

    await throwUnlessUserCan(c, "delete", "Member", org.id)
    await ensureAtLeastOneOwner(c, org.id, userIds, "remove")

    await c
      .get("db")
      .deleteFrom("members")
      .where((eb) =>
        eb.and([eb("orgId", "=", org.id), eb("userId", "in", userIds)])
      )
      .returningAll()
      .execute()

    const members = await findOrgMembers(c, org.id)

    return c.json(
      {
        id: org.id,
        name: org.name,
        handle: org.handle,
        members: members.map((m) => ({ userId: m.userId, role: m.role })),
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

orgRoutes.openapi(getOrganizationMembers, async (c) => {
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
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const userDetails = await getUserById(c, member.userId)
        if (!userDetails) {
          const msg = await t.text(ERROR_INVALID_USER)
          throw new UnprocessableEntityError(msg)
        }
        return {
          userId: member.userId,
          fullName: userDetails.fullName,
          email: userDetails.email,
          profileImage: userDetails.profileImage ?? null,
          avatar: userDetails.avatar ?? null,
          role: member.role,
        }
      })
    )

    return c.json(memberDetails, 200)
  } catch (error) {
    return await processError<typeof getOrganizationMembers>(c, error, [
      "{{ default }}",
      "get-org-members",
    ])
  }
})

orgRoutes.openapi(getOrganizationPermissions, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrgByHandle(c, handle)

    const orgPermissions = await c.get("rbac").getOrgPermissions(org.id)

    const permissions = (orgPermissions?.permissions ?? []).map((p: any) => ({
      ...p,
      subject: p.subject === "Organisation" ? "Org" : p.subject,
    }))

    return c.json(permissions, 200)
  } catch (error) {
    return await processError<typeof getOrganizationPermissions>(c, error, [
      "{{ default }}",
      "get-org-permissions",
    ])
  }
})

export default orgRoutes
