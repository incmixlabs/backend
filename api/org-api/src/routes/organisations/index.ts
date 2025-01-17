import type { NewMember } from "@/dbSchema"
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
  findOrgMemberById,
  findOrgMemberPermissions,
  findOrgMembers,
  findOrganisationByHandle,
  findOrganisationById,
  findOrganisationByUserId,
  getDatabase,
  getUserByEmail,
  getUserById,
  insertMembers,
  insertOrganisation,
  isOrgMember,
  isValidUser,
  throwUnlessUserCan,
} from "@/lib/db"
import { getRoleIdByName } from "@/lib/helper"
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
import type { MemberRole } from "@jsprtmnn/utils/types"
import { ROLE_OWNER } from "@jsprtmnn/utils/types"

import { generateId } from "lucia"

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

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "read",
      subject: "Organisation",
    })

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

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "read",
      subject: "Organisation",
    })

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

    const orgExists = await doesOrganisationExist(c, name)

    if (orgExists) {
      const msg = await t.text(ERROR_ORG_EXIST)
      throw new ConflictError(msg)
    }

    const invalidMembers = (
      await Promise.all(members.map((m) => isValidUser(c, m.userId)))
    ).some((r) => !r)

    if (invalidMembers) {
      const msg = await t.text(ERROR_INVALID_USER)
      throw new UnprocessableEntityError(msg)
    }

    const orgId = generateId(15)
    const dbRoles = await findAllRoles(c)

    if (!dbRoles.length) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const newOrg = await insertOrganisation(c, { id: orgId, name, handle })

    if (!newOrg) {
      const msg = await t.text(ERROR_ORG_CREATE_FAIL)
      throw new ServerError(msg)
    }

    const ownerRole = getRoleIdByName(dbRoles, ROLE_OWNER)
    if (!ownerRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    await insertMembers(c, [
      {
        userId: user.id,
        orgId: orgId,
        roleId: ownerRole,
      },
      ...members.map<NewMember>((m) => ({
        userId: m.userId,
        orgId: newOrg.id,
        roleId: getRoleIdByName(dbRoles, m.role) ?? 3,
      })),
    ])

    return c.json(
      {
        id: newOrg.id,
        name: newOrg.name,
        handle: newOrg.handle,
        members: [
          { userId: user.id, role: ROLE_OWNER as MemberRole },
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
    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "create",
      subject: "Member",
    })

    const existingUser = await getUserByEmail(c, email)
    const userId = existingUser.id

    const isMember = await isOrgMember(c, userId, org.id)
    if (isMember) {
      const msg = await t.text(ERROR_MEMBER_EXIST)
      throw new ConflictError(msg)
    }
    const dbRoles = await findAllRoles(c)
    const dbRole = getRoleIdByName(dbRoles, role)
    if (!dbRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }

    const [newMember] = await insertMembers(c, [
      { userId, orgId: org.id, roleId: dbRole },
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
    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "update",
      subject: "Organisation",
    })
    const db = getDatabase(c)
    const updatedOrg = await db
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

    return c.json(
      {
        id: org.id,
        name: name,
        handle: org.handle,
        members: members.map((m) => ({ userId: m.userId, role: m.role })),
      },
      200
    )
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

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "delete",
      subject: "Organisation",
    })
    const db = getDatabase(c)
    const deletedMembers = await db
      .deleteFrom("members")
      .where("orgId", "=", org.id)
      .returningAll()
      .execute()

    if (!deletedMembers.length) {
      const msg = await t.text(ERROR_ORG_DELETE_FAIL)
      throw new ServerError(msg)
    }

    const deletedOrg = await db
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

    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "delete",
      subject: "Member",
    })
    await ensureAtLeastOneOwner(c, org.id, userIds, "remove")
    const db = getDatabase(c)
    await db
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

    const org = await findOrganisationByHandle(c, handle)

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "update",
      subject: "Member",
    })

    const member = await findOrgMemberById(c, userId, org.id)

    if (member.role === ROLE_OWNER && newRole !== ROLE_OWNER) {
      await ensureAtLeastOneOwner(c, org.id, [userId], "update")
    }

    const dbRoles = await findAllRoles(c)
    const dbRole = getRoleIdByName(dbRoles, newRole)
    if (!dbRole) {
      const msg = await t.text(ERROR_NO_ROLES)
      throw new ServerError(msg)
    }
    const db = getDatabase(c)
    const updated = await db
      .updateTable("members")
      .set({ roleId: dbRole })
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

    await throwUnlessUserCan({
      c,
      user,
      org,
      action: "read",
      subject: "Member",
    })

    const members = await findOrgMembers(c, org.id)
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const userDetails = await getUserById(c, member.userId)
        return {
          userId: member.userId,
          fullName: userDetails.fullName,
          email: userDetails.email,
          profileImage: userDetails.profileImage,
          avatar: userDetails.avatar,
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

    const { permissions } = await findOrgMemberPermissions(c, user, org)

    return c.json(permissions, 200)
  } catch (error) {
    return await processError<typeof getOrganizationPermissions>(c, error, [
      "{{ default }}",
      "get-organization-permissions",
    ])
  }
})

export default orgRoutes
