import { OpenAPIHono } from "@hono/zod-openapi"
import type { UserRole } from "@incmix/utils/types"
import { UserRoles } from "@incmix/utils/types"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { nanoid } from "nanoid"
import {
  ERROR_INVALID_USER,
  ERROR_MEMBER_EXIST,
  ERROR_MEMBER_INSERT_FAIL,
  ERROR_MEMBER_UPDATE_FAIL,
  ERROR_NO_ROLES,
  ERROR_ORG_CREATE_FAIL,
  ERROR_ORG_DELETE_FAIL,
  ERROR_ORG_EXIST,
  ERROR_ORG_UPDATE_FAIL,
  ORG_DELETE_SUCCESS,
} from "@/lib/constants"
import {
  checkHandleAvailability,
  doesOrganisationExist,
  ensureAtLeastOneOwner,
  findAllRoles,
  findOrganisationByHandle,
  findOrganisationById,
  findOrganisationByUserId,
  findOrgMemberById,
  findOrgMembers,
  findRoleByName,
  getUserByEmail,
  getUserById,
  insertMembers,
  insertOrganisation,
  isValidUser,
} from "@/lib/db"
import { throwUnlessUserCan } from "@/lib/helper"
import {
  addMember,
  createOrganisation,
  deleteOrganisation,
  getOrganisation,
  getOrganisationById,
  getOrganizationMembers,
  getOrganizationPermissions,
  getUserOrganisations,
  removeMembers,
  updateMemberRole,
  updateOrganisation,
  validateHandle,
} from "@/routes/organisations/openapi"
import type { HonoApp } from "@/types"

const orgRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

orgRoutes.openapi(getOrganisation, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan(c, "read", "Organisation", org.id)

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
    return await processError<typeof getOrganisation>(c, error, [
      "{{ default }}",
      "get-organisation",
    ])
  }
})
orgRoutes.openapi(getOrganisationById, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { id } = c.req.valid("param")
    const org = await findOrganisationById(c, id)

    await throwUnlessUserCan(c, "read", "Organisation", org.id)

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
    return await processError<typeof getOrganisation>(c, error, [
      "{{ default }}",
      "get-organisation-by-id",
    ])
  }
})

orgRoutes.openapi(getUserOrganisations, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const userOrgs = await findOrganisationByUserId(c, user.id)

    return c.json(userOrgs, 200)
  } catch (error) {
    return await processError<typeof getUserOrganisations>(c, error, [
      "{{ default }}",
      "get-user-organisations",
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

orgRoutes.openapi(createOrganisation, async (c) => {
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

    const orgExists = await doesOrganisationExist(c, name, user.id)

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

    const newOrg = await insertOrganisation(c, {
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
    return await processError<typeof createOrganisation>(c, error, [
      "{{ default }}",
      "create-organisation",
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

    const org = await findOrganisationById(c, handle)

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

orgRoutes.openapi(updateOrganisation, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")

    const { name } = c.req.valid("json")
    const org = await findOrganisationById(c, handle)

    await throwUnlessUserCan(c, "update", "Organisation", org.id)

    const orgExists = await doesOrganisationExist(c, name, user.id)

    if (orgExists) {
      const msg = await t.text(ERROR_ORG_EXIST)
      throw new ConflictError(msg)
    }

    const updatedOrg = await c
      .get("db")
      .updateTable("organisations")
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
    return await processError<typeof updateOrganisation>(c, error, [
      "{{ default }}",
      "update-organisation",
    ])
  }
})

orgRoutes.openapi(deleteOrganisation, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")

    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan(c, "delete", "Organisation", org.id)

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
      .deleteFrom("organisations")
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
    return await processError<typeof deleteOrganisation>(c, error, [
      "{{ default }}",
      "delete-organisation",
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

    const org = await findOrganisationById(c, handle)

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

orgRoutes.openapi(updateMemberRole, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { handle } = c.req.valid("param")
    const { role: newRole, userId } = c.req.valid("json")

    const org = await findOrganisationById(c, handle)

    await throwUnlessUserCan(c, "update", "Member", org.id)

    const member = await findOrgMemberById(c, userId, org.id)

    if (
      member.role === UserRoles.ROLE_OWNER &&
      newRole !== UserRoles.ROLE_OWNER
    ) {
      await ensureAtLeastOneOwner(c, org.id, [userId], "update")
    }

    const dbRole = await findRoleByName(c, newRole)
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
    return await processError<typeof updateMemberRole>(c, error, [
      "{{ default }}",
      "update-member-role",
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
    const org = await findOrganisationByHandle(c, handle)

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
      "get-organization-members",
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
    const org = await findOrganisationByHandle(c, handle)

    const orgPermissions = await c.get("rbac").getOrgPermissions(org.id)

    return c.json(orgPermissions?.permissions ?? [], 200)
  } catch (error) {
    return await processError<typeof getOrganizationPermissions>(c, error, [
      "{{ default }}",
      "get-organization-permissions",
    ])
  }
})

export default orgRoutes
