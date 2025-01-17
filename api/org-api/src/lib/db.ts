import type {
  Database,
  NewMember,
  NewOrganisation,
  Organisation,
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
import { createAbilityFromPermissions } from "@jsprtmnn/utils/casl"

import { useTranslation } from "@incmix-api/utils/middleware"
import { ERROR_CASL_FORBIDDEN, generateSentryHeaders } from "@incmix-api/utils"
import type { AuthUser, UserProfile } from "@jsprtmnn/utils/types"
import type { Action, Permission } from "@jsprtmnn/utils/types"
import { ROLE_OWNER, ROLE_SUPER_ADMIN } from "@jsprtmnn/utils/types"
import { getCookie } from "hono/cookie"
import { defaultPermissions, interpolate } from "./casl"
import {
  ERROR_LAST_OWNER,
  ERROR_NOT_MEMBER,
  ERROR_ORG_NOT_FOUND,
} from "./constants"

import { D1Dialect } from "@noxharmonium/kysely-d1"
import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely"
import { jsonArrayFrom } from "kysely/helpers/sqlite"

export const getDatabase = (c: Context) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.DB }),
    plugins: [new CamelCasePlugin()],
  })
}

export async function getUserByEmail(c: Context, email: string) {
  const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${c.env.USERS_URL}?email=${email}`
  const sentryHeaders = generateSentryHeaders(c)
  const res = await c.env.USERS.fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (res.status === 500) throw new ServerError()
  if (res.status === 401) throw new UnauthorizedError()
  if (res.status === 404) throw new NotFoundError()

  return await res.json<UserProfile>()
}
export async function getUserById(c: Context, id: string) {
  const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${c.env.USERS_URL}?id=${id}`
  const sentryHeaders = generateSentryHeaders(c)

  const res = await c.env.USERS.fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (!res.ok) throw new ServerError()

  return await res.json<UserProfile>()
}
export async function isValidUser(c: Context, id: string) {
  const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${c.env.USERS_URL}?id=${id}`
  const sentryHeaders = generateSentryHeaders(c)
  const res = await c.env.USERS.fetch(url, {
    method: "GET",
    headers: {
      cookie: c.req.header("cookie") || "",
      ...sentryHeaders,
    },
  })

  if (!res.ok) return false

  const user = await res.json<UserProfile>()

  if (Object.hasOwn(user, "id")) return true

  return false
}

export function findAllRoles(c: Context) {
  const db = getDatabase(c)

  return db.selectFrom("roles").selectAll().execute()
}

export function insertOrganisation(c: Context, org: NewOrganisation) {
  const db = getDatabase(c)
  return db
    .insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()
}

export async function checkHandleAvailability(c: Context, handle: string) {
  const db = getDatabase(c)

  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()
  if (!org) return true
  return false
}
export async function findOrganisationByHandle(c: Context, handle: string) {
  const db = getDatabase(c)

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
    .filter((m) => m.role === ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}
export async function findOrganisationByName(c: Context, name: string) {
  const db = getDatabase(c)

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

export function findOrganisationByUserId(c: Context, userId: string) {
  const db = getDatabase(c)
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
  const db = getDatabase(c)
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
    .filter((m) => m.role === ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}

export function insertMembers(c: Context, members: NewMember[]) {
  const db = getDatabase(c)
  return db.insertInto("members").values(members).returningAll().execute()
}

export async function findOrgMemberById(
  c: Context,
  userId: string,
  orgId: string
) {
  const db = getDatabase(c)

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
  const db = getDatabase(c)

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

  let permissions = member.permissions as Permission[]

  if (user.userType === ROLE_SUPER_ADMIN) {
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
  const db = getDatabase(c)

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
  const currentMembers = await findOrgMembers(c, orgId)
  const adminMembers = currentMembers.filter((m) => m.role === ROLE_OWNER)

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
  const db = getDatabase(c)
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
  c: Context,
  name: string
): Promise<boolean> {
  const db = getDatabase(c)
  const org = await db
    .selectFrom("organisations")
    .select("id")
    .where("name", "=", name)
    .executeTakeFirst()

  return !!org
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
