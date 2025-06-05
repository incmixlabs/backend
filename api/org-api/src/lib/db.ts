import type { Context } from "@/types"
import { subject as caslSubject } from "@casl/ability"
import {
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from "@incmix-api/utils/errors"
import { createAbilityFromPermissions } from "@incmix/utils/casl"

import { ERROR_CASL_FORBIDDEN } from "@incmix-api/utils"
import { useTranslation } from "@incmix-api/utils/middleware"
import {
  type Action,
  type AuthUser,
  type Permission,
  type Subject,
  UserRoles,
} from "@incmix/utils/types"

import { defaultPermissions, interpolate } from "./casl"
import {
  ERROR_LAST_OWNER,
  ERROR_NOT_MEMBER,
  ERROR_ORG_NOT_FOUND,
} from "./constants"

import type {
  KyselyDb,
  MemberRole,
  NewMember,
  NewOrganisation,
  NewPermission,
  NewRole,
  Organisation,
  UpdatedPermission,
  UpdatedRole,
} from "@incmix-api/utils/db-schema"
import { jsonArrayFrom } from "kysely/helpers/postgres"

export async function getUserByEmail(c: Context, email: string) {
  return await c
    .get("db")
    .selectFrom("userProfiles")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
}
export async function getUserById(c: Context, id: string) {
  return await c
    .get("db")
    .selectFrom("userProfiles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function isValidUser(c: Context, id: string) {
  const user = await getUserById(c, id)
  return !!user
}

export function findAllRoles(c: Context) {
  return c.get("db").selectFrom("roles").selectAll().execute()
}

export function insertRole(c: Context, role: NewRole) {
  return c
    .get("db")
    .insertInto("roles")
    .values({ name: role.name })
    .returningAll()
    .executeTakeFirst()
}

export function findRoleByName(c: Context, name: string) {
  return c
    .get("db")
    .selectFrom("roles")
    .selectAll()
    .where("name", "=", name as MemberRole)
    .executeTakeFirst()
}
export function findRoleById(c: Context, id: number) {
  return c
    .get("db")
    .selectFrom("roles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export function updateRoleById(c: Context, role: UpdatedRole, id: number) {
  return c
    .get("db")
    .updateTable("roles")
    .set(role)
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function deleteRoleById(c: Context, id: number) {
  return await c
    .get("db")
    .transaction()
    .execute(async (tx) => {
      await tx
        .deleteFrom("permissions")
        .where("roleId", "=", id)
        .executeTakeFirstOrThrow()
      return await tx
        .deleteFrom("roles")
        .where("id", "=", id)
        .executeTakeFirstOrThrow()
    })
}

export function findAllPermissions(c: Context) {
  return c
    .get("db")
    .selectFrom("permissions")
    .innerJoin("roles", "roles.id", "permissions.roleId")
    .select([
      "permissions.id",
      "roles.id as roleId",
      "roles.name as role",
      "permissions.action",
      "permissions.subject",
      "permissions.conditions",
    ])
    .execute()
}

export function findPermissionBySubjectAndAction(
  c: Context,
  subject: Subject,
  action: Action,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .selectFrom("permissions")
    .selectAll()
    .where("subject", "=", subject)
    .where("action", "=", action)
    .where("roleId", "=", roleId)
    .executeTakeFirst()
}

export function insertPermission(
  c: Context,
  permission: NewPermission,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .insertInto("permissions")
    .values(permission)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updatePermission(
  c: Context,
  permission: UpdatedPermission,
  id: number,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .updateTable("permissions")
    .set(permission)
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function deletePermission(c: Context, id: number, instance?: KyselyDb) {
  return (instance ?? c.get("db"))
    .deleteFrom("permissions")
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function insertOrganisation(c: Context, org: NewOrganisation) {
  return c
    .get("db")
    .insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()
}

export async function checkHandleAvailability(c: Context, handle: string) {
  const org = await c
    .get("db")
    .selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()
  if (!org) return true
  return false
}
export async function findOrganisationByHandle(c: Context, handle: string) {
  const org = await c
    .get("db")

    .selectFrom("organisations")
    .select((eb) => [
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      jsonArrayFrom(
        eb
          .selectFrom("members")
          .innerJoin("roles", "roles.id", "members.roleId")
          .select(["members.userId as userId", "roles.name as role"])
          .whereRef("members.orgId", "=", "organisations.id")
      ).as("members"),
    ])
    .where("handle", "=", handle)
    .executeTakeFirst()

  if (!org) {
    const t = await useTranslation(c)
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}
export async function findOrganisationByName(c: Context, name: string) {
  const org = await c
    .get("db")
    .selectFrom("organisations")
    .selectAll()
    .where("name", "=", name)
    .executeTakeFirst()

  const t = await useTranslation(c)
  if (!org) {
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  return org
}

export function findOrganisationByUserId(c: Context, userId: string) {
  return c
    .get("db")
    .selectFrom("organisations")
    .innerJoin("members", "members.orgId", "organisations.id")
    .select((eb) => [
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      jsonArrayFrom(
        eb
          .selectFrom("members")
          .innerJoin("roles", "roles.id", "members.roleId")
          .select(["members.userId as userId", "roles.name as role"])
          .whereRef("members.orgId", "=", "organisations.id")
      ).as("members"),
    ])
    .where("members.userId", "=", userId)
    .execute()
}

export async function findOrganisationById(c: Context, id: string) {
  const org = await c
    .get("db")
    .selectFrom("organisations")
    .select((eb) => [
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      jsonArrayFrom(
        eb
          .selectFrom("members")
          .innerJoin("roles", "roles.id", "members.roleId")
          .select(["members.userId as userId", "roles.name as role"])
          .whereRef("members.orgId", "=", "organisations.id")
      ).as("members"),
    ])
    .where("id", "=", id)
    .executeTakeFirst()

  if (!org) {
    const t = await useTranslation(c)
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}

export function insertMembers(c: Context, members: NewMember[]) {
  return c
    .get("db")
    .insertInto("members")
    .values(members)
    .returningAll()
    .execute()
}

export async function findOrgMemberById(
  c: Context,
  userId: string,
  orgId: string
) {
  const member = await c
    .get("db")
    .selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .select(["orgId", "roleId", "userId", "roles.name as role"])
    .where((eb) =>
      eb.and([
        eb("members.userId", "=", userId),
        eb("members.orgId", "=", orgId),
      ])
    )
    .executeTakeFirst()

  const t = await useTranslation(c)
  if (!member?.userId) {
    const msg = await t.text(ERROR_NOT_MEMBER)
    throw new NotFoundError(msg)
  }

  return member
}
export async function findOrgMemberPermissions(
  c: Context,
  user: AuthUser,
  org: Organisation & { owners: string[] }
) {
  const member = await c
    .get("db")
    .selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .select((eb) => [
      "orgId",
      "roleId",
      "userId",
      "roles.name as role",
      jsonArrayFrom(
        eb
          .selectFrom("permissions")
          .select(["id", "roleId", "action", "subject", "conditions"])
          .whereRef("permissions.roleId", "=", "members.roleId")
      ).as("permissions"),
    ])
    .where((eb) =>
      eb.and([
        eb("members.userId", "=", user.id),
        eb("members.orgId", "=", org.id),
      ])
    )
    .executeTakeFirst()

  const t = await useTranslation(c)
  if (!member?.userId) {
    const msg = await t.text(ERROR_NOT_MEMBER)
    throw new NotFoundError(msg)
  }

  let permissions = member.permissions

  if (user.userType === UserRoles.ROLE_SUPER_ADMIN) {
    // @ts-expect-error - defaultPermissions is not typed
    permissions = defaultPermissions
  }

  const interpolatedPermissions: Permission[] = interpolate(
    JSON.stringify(permissions),
    {
      owner: org.owners,
    }
  )

  return { member, permissions: interpolatedPermissions }
}

export function findOrgMembers(c: Context, orgId: string) {
  return c
    .get("db")
    .selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .select(["members.userId", "members.orgId", "roles.name as role"])
    .where("members.orgId", "=", orgId)
    .execute()
}

export async function ensureAtLeastOneOwner(
  c: Context,
  orgId: string,
  affectedUserIds: string[],
  operation: "remove" | "update"
): Promise<void> {
  const t = await useTranslation(c)
  const currentMembers = await findOrgMembers(c, orgId)
  const adminMembers = currentMembers.filter(
    (m) => m.role === UserRoles.ROLE_OWNER
  )

  if (operation === "remove") {
    const removingAdmins = affectedUserIds.some((userId) =>
      adminMembers.some((admin) => admin.userId === userId)
    )
    if (removingAdmins && adminMembers.length <= affectedUserIds.length) {
      const msg = await t.text(ERROR_LAST_OWNER)
      throw new PreconditionFailedError(msg)
    }
  } else if (operation === "update") {
    if (adminMembers.length === 1) {
      const admin = adminMembers[0]
      if (admin && affectedUserIds.includes(admin.userId)) {
        const msg = await t.text(ERROR_LAST_OWNER)
        throw new PreconditionFailedError(msg)
      }
    }
  }
}

export async function isOrgMember(
  c: Context,
  userId: string,
  orgId: string
): Promise<boolean> {
  const member = await c
    .get("db")
    .selectFrom("members")
    .select("userId")
    .where((eb) =>
      eb.and([
        eb("members.orgId", "=", orgId),
        eb("members.userId", "=", userId),
      ])
    )
    .executeTakeFirst()

  return !!member
}

export async function doesOrganisationExist(
  c: Context,
  name: string,
  userId: string
): Promise<boolean> {
  const org = await c
    .get("db")
    .selectFrom("organisations")
    .select("id")
    .where((eb) => eb.and([eb("name", "=", name)]))
    .executeTakeFirst()

  if (!org) return false

  const members = await findOrgMembers(c, org.id)
  return members.some((m) => m.userId === userId)
}

export async function throwUnlessUserCan({
  c,
  user,
  org,
  action,
  subject,
}: {
  c: Context
  user: AuthUser
  org: Organisation & { owners: string[] }
  action: Action
  subject: "Organisation" | "Member"
}) {
  const { member, permissions } = await findOrgMemberPermissions(c, user, org)

  const ability = createAbilityFromPermissions(permissions)
  const sub = caslSubject(subject, { ...org, owner: member.userId })

  if (!ability.can(action, sub)) {
    const t = await useTranslation(c)
    const msg = await t.text(ERROR_CASL_FORBIDDEN, {
      role: member.role,
      action,
    })
    throw new ForbiddenError(msg)
  }
}
