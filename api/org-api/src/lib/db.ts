import type {
  Database,
  MemberRole,
  NewMember,
  NewOrganisation,
  NewPermission,
  NewRole,
  Organisation,
  UpdatedPermission,
  UpdatedRole,
} from "@/dbSchema"
import type { Context } from "@/types"
import { subject as caslSubject } from "@casl/ability"
import {
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  ServerError,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import { createAbilityFromPermissions } from "@incmix/utils/casl"

import { ERROR_CASL_FORBIDDEN, generateSentryHeaders } from "@incmix-api/utils"
import { useTranslation } from "@incmix-api/utils/middleware"
import {
  type Action,
  type AuthUser,
  type Permission,
  type Subject,
  type UserProfile,
  UserRoles,
} from "@incmix/utils/types"

import { getCookie } from "hono/cookie"
import { defaultPermissions, interpolate } from "./casl"
import {
  ERROR_LAST_OWNER,
  ERROR_NOT_MEMBER,
  ERROR_ORG_NOT_FOUND,
} from "./constants"

import { envVars } from "@/env-vars"
import {
  CamelCasePlugin,
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
} from "kysely"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import pg from "pg"

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: envVars.DATABASE_URL,
    max: 10,
  }),
})
export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()],
})

export async function getUserByEmail(c: Context, email: string) {
  const sessionId = getCookie(c, envVars.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${envVars.USERS_URL}?email=${email}`
  const sentryHeaders = generateSentryHeaders(c)
  const res = await fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (res.status === 500) throw new ServerError()
  if (res.status === 401) throw new UnauthorizedError()
  if (res.status === 404) throw new NotFoundError()

  return (await res.json()) as UserProfile
}
export async function getUserById(c: Context, id: string) {
  const sessionId = getCookie(c, envVars.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${envVars.USERS_URL}?id=${id}`
  const sentryHeaders = generateSentryHeaders(c)

  const res = await fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (!res.ok) throw new ServerError()

  return (await res.json()) as UserProfile
}
export async function isValidUser(c: Context, id: string) {
  const sessionId = getCookie(c, envVars.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${envVars.USERS_URL}?id=${id}`
  const sentryHeaders = generateSentryHeaders(c)
  const res = await fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (!res.ok) return false

  const user = (await res.json()) as UserProfile

  if (Object.hasOwn(user, "id")) return true

  return false
}

export function findAllRoles() {
  return db.selectFrom("roles").selectAll().execute()
}

export function insertRole(role: NewRole) {
  return db
    .insertInto("roles")
    .values({ name: role.name })
    .returningAll()
    .executeTakeFirst()
}

export function findRoleByName(name: string) {
  return db
    .selectFrom("roles")
    .selectAll()
    .where("name", "=", name as MemberRole)
    .executeTakeFirst()
}
export function findRoleById(id: number) {
  return db
    .selectFrom("roles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export function updateRoleById(role: UpdatedRole, id: number) {
  return db
    .updateTable("roles")
    .set(role)
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function deleteRoleById(id: number) {
  return await db.transaction().execute(async (tx) => {
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

export function findAllPermissions() {
  return db
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
  subject: Subject,
  action: Action,
  roleId: number,
  instance?: Kysely<Database>
) {
  return (instance ?? db)
    .selectFrom("permissions")
    .selectAll()
    .where("subject", "=", subject)
    .where("action", "=", action)
    .where("roleId", "=", roleId)
    .executeTakeFirst()
}

export function insertPermission(
  permission: NewPermission,
  instance?: Kysely<Database>
) {
  return (instance ?? db)
    .insertInto("permissions")
    .values(permission)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updatePermission(
  permission: UpdatedPermission,
  id: number,
  instance?: Kysely<Database>
) {
  return (instance ?? db)
    .updateTable("permissions")
    .set(permission)
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function deletePermission(id: number, instance?: Kysely<Database>) {
  return (instance ?? db)
    .deleteFrom("permissions")
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function insertOrganisation(org: NewOrganisation) {
  return db
    .insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()
}

export async function checkHandleAvailability(handle: string) {
  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()
  if (!org) return true
  return false
}
export async function findOrganisationByHandle(c: Context, handle: string) {
  const org = await db
    .withPlugin(new ParseJSONResultsPlugin())
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
  const org = await db
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

export function findOrganisationByUserId(userId: string) {
  return db
    .withPlugin(new ParseJSONResultsPlugin())
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
  const org = await db
    .withPlugin(new ParseJSONResultsPlugin())
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

export function insertMembers(members: NewMember[]) {
  return db.insertInto("members").values(members).returningAll().execute()
}

export async function findOrgMemberById(
  c: Context,
  userId: string,
  orgId: string
) {
  const member = await db
    .withPlugin(new ParseJSONResultsPlugin())
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
  const member = await db
    .withPlugin(new ParseJSONResultsPlugin())
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

export function findOrgMembers(orgId: string) {
  return db
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
  const currentMembers = await findOrgMembers(orgId)
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
  userId: string,
  orgId: string
): Promise<boolean> {
  const member = await db
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
  name: string,
  userId: string
): Promise<boolean> {
  const org = await db
    .selectFrom("organisations")
    .select("id")
    .where((eb) => eb.and([eb("name", "=", name)]))
    .executeTakeFirst()

  if (!org) return false

  const members = await findOrgMembers(org.id)
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
