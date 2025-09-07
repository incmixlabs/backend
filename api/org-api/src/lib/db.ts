import type { Action, Subject } from "@incmix/utils/types"
import { UserRoles } from "@incmix/utils/types"
import type {
  Env as FeatureFlagEnv,
  KyselyDb,
  NewFeatureFlag,
  NewMember,
  NewOrganisation,
  NewPermission,
  NewRole,
  UpdatedFeatureFlag,
  UpdatedPermission,
  UpdatedRole,
} from "@incmix-api/utils/db-schema"
import {
  NotFoundError,
  PreconditionFailedError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyRequest } from "fastify"
import { sql } from "kysely"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import {
  ERROR_LAST_OWNER,
  ERROR_NOT_MEMBER,
  ERROR_ORG_NOT_FOUND,
} from "./constants"

export async function getUserByEmail(request: FastifyRequest, email: string) {
  return await request.db
    ?.selectFrom("userProfiles")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
}
export async function getUserById(request: FastifyRequest, id: string) {
  return await request.db
    ?.selectFrom("userProfiles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function isValidUser(request: FastifyRequest, id: string) {
  const user = await getUserById(request, id)
  return !!user
}

export function findAllRoles(request: FastifyRequest, orgId?: string) {
  let query = request.db?.selectFrom("roles").selectAll()
  if (!query) return Promise.resolve([])

  if (orgId) {
    query = query.where((eb) =>
      eb.or([
        eb("organizationId", "=", orgId),
        eb("organizationId", "is", null),
      ])
    )
  }

  return query.execute()
}

export function findRoleByName(
  request: FastifyRequest,
  name: string,
  orgId?: string
) {
  let query = request.db?.selectFrom("roles").selectAll()
  if (!query) return Promise.resolve(undefined)

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("organizationId", "=", orgId), eb("name", "=", name)])
    )
  } else {
    query = query.where("name", "=", name)
  }

  return query.executeTakeFirst()
}

export function findRoleById(
  request: FastifyRequest,
  id: number,
  orgId?: string
) {
  let query = request.db?.selectFrom("roles").selectAll()
  if (!query) return Promise.resolve(undefined)

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("organizationId", "=", orgId), eb("id", "=", id)])
    )
  } else {
    query = query.where("id", "=", id)
  }

  return query.executeTakeFirst()
}

export function insertOrganisation(
  request: FastifyRequest,
  org: NewOrganisation
) {
  return request.db
    ?.insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()
}

export async function checkHandleAvailability(
  request: FastifyRequest,
  handle: string
) {
  const org = await request.db
    ?.selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()
  if (!org) return true
  return false
}

export async function findOrganisationByHandle(
  request: FastifyRequest,
  handle: string
) {
  const org = await request.db
    ?.selectFrom("organisations")
    .select((eb) => [
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      "organisations.createdAt",
      "organisations.updatedAt",
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
    const t = await useTranslation(request)
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}
export async function findOrganisationByName(
  request: FastifyRequest,
  name: string
) {
  const org = await request.db
    ?.selectFrom("organisations")
    .selectAll()
    .where("name", "=", name)
    .executeTakeFirst()

  const t = await useTranslation(request)
  if (!org) {
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  return org
}

export function findOrganisationByUserId(
  request: FastifyRequest,
  userId: string
) {
  return request.db
    ?.selectFrom("organisations")
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

export async function findOrganisationById(
  request: FastifyRequest,
  id: string
) {
  const org = await request.db
    ?.selectFrom("organisations")
    .select((eb) => [
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      "organisations.createdAt",
      "organisations.updatedAt",
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
    const t = await useTranslation(request)
    const msg = await t.text(ERROR_ORG_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}

export function insertMembers(request: FastifyRequest, members: NewMember[]) {
  return request.db
    ?.insertInto("members")
    .values(members)
    .returningAll()
    .execute()
}

export async function findOrgMemberById(
  request: FastifyRequest,
  userId: string,
  orgId: string
) {
  const member = await request.db
    ?.selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .select(["orgId", "roleId", "userId", "roles.name as role"])
    .where((eb) =>
      eb.and([
        eb("members.userId", "=", userId),
        eb("members.orgId", "=", orgId),
      ])
    )
    .executeTakeFirst()

  const t = await useTranslation(request)
  if (!member?.userId) {
    const msg = await t.text(ERROR_NOT_MEMBER)
    throw new NotFoundError(msg)
  }

  return member
}

export function findOrgMembers(request: FastifyRequest, orgId: string) {
  const query = request.db
    ?.selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .select(["members.userId", "members.orgId", "roles.name as role"])
    .where("members.orgId", "=", orgId)

  if (!query) return Promise.resolve([])
  return query.execute()
}

export async function ensureAtLeastOneOwner(
  request: FastifyRequest,
  orgId: string,
  affectedUserIds: string[],
  operation: "remove" | "update"
): Promise<void> {
  const t = await useTranslation(request)
  const currentMembers = await findOrgMembers(request, orgId)
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

export async function doesOrganisationExist(
  request: FastifyRequest,
  name: string,
  userId: string
): Promise<boolean> {
  const org = await request.db
    ?.selectFrom("organisations")
    .select("id")
    .where((eb) => eb.and([eb("name", "=", name)]))
    .executeTakeFirst()

  if (!org) return false

  const members = await findOrgMembers(request, org.id)
  return members.some((m) => m.userId === userId)
}

export function insertRole(request: FastifyRequest, role: NewRole) {
  return request.db
    ?.insertInto("roles")
    .values(role)
    .returningAll()
    .executeTakeFirst()
}

export function updateRoleById(
  request: FastifyRequest,
  role: UpdatedRole,
  id: number
) {
  return request.db
    ?.updateTable("roles")
    .set(role)
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function deleteRoleById(request: FastifyRequest, id: number) {
  return await request.db?.transaction().execute(async (tx) => {
    const inUse = await tx
      .selectFrom("members")
      .select("userId")
      .where("roleId", "=", id)
      .limit(1)
      .executeTakeFirst()
    if (inUse) {
      throw new PreconditionFailedError("role_in_use")
    }
    if (inUse) {
      throw new PreconditionFailedError("role_in_use")
    }
    await tx.deleteFrom("rolePermissions").where("roleId", "=", id).execute()
    return await tx
      .deleteFrom("roles")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow()
  })
}

export function findPermissionBySubjectAndAction(
  request: FastifyRequest,
  subject: Subject,
  action: Action,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? (request as any).db)
    .selectFrom("rolePermissions")
    .innerJoin("permissions", "permissions.id", "rolePermissions.permissionId")
    .selectAll()
    .where("permissions.resourceType", "=", subject)
    .where("permissions.action", "=", action)
    .where("rolePermissions.roleId", "=", roleId)
    .executeTakeFirst()
}

export function insertPermission(
  request: FastifyRequest,
  permission: NewPermission,
  instance?: KyselyDb
) {
  return (instance ?? (request as any).db)
    .insertInto("permissions")
    .values(permission)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updatePermission(
  request: FastifyRequest,
  permission: UpdatedPermission,
  id: number,
  instance?: KyselyDb
) {
  return (instance ?? (request as any).db)
    .updateTable("permissions")
    .set(permission)
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function deletePermission(
  request: FastifyRequest,
  id: number,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? (request as any).db)
    .deleteFrom("rolePermissions")
    .where((eb: any) =>
      eb.and([eb("permissionId", "=", id), eb("roleId", "=", roleId)])
    )
    .executeTakeFirstOrThrow()
}

export async function getFeatureFlags(
  request: FastifyRequest,
  userId: string,
  env?: FeatureFlagEnv
) {
  // First check if user is a superuser
  const isSuperUser = await isUserSuperUser(request, userId)

  const query = request.db
    ?.selectFrom("featureFlags")
    .selectAll()
    .where((eb) => {
      const ands = [eb("enabled", "=", true)]
      if (env && env !== "all")
        ands.push(
          eb.or([
            eb("allowedEnv", "@>", sql`ARRAY[${env}]` as any),
            eb("allowedEnv", "@>", sql`ARRAY['all']` as any),
          ])
        )

      if (!isSuperUser) {
        ands.push(
          eb.or([
            eb("allowedUsers", "@>", sql`ARRAY['all']` as any),
            eb("allowedUsers", "@>", sql`ARRAY[${userId}]` as any),
          ])
        )
      }

      return eb.and(ands)
    })

  if (!query) return []
  return query.execute()
}

export async function getFeatureFlagById(
  request: FastifyRequest,
  featureFlagId: string,
  userId: string
) {
  const featureFlag = await request.db
    ?.selectFrom("featureFlags")
    .selectAll()
    .where("id", "=", featureFlagId)
    .where("enabled", "=", true)
    .executeTakeFirst()

  if (!featureFlag) {
    return null
  }

  // Check if user is a superuser
  const isSuperUser = await isUserSuperUser(request, userId)

  if (isSuperUser) {
    // Super users can access all feature flags
    return featureFlag
  }

  // Check if regular user has access to this feature flag
  const hasAccess =
    featureFlag.allowedUsers.includes("all") ||
    featureFlag.allowedUsers.includes(userId)

  if (!hasAccess) {
    return null
  }

  return featureFlag
}

export async function createFeatureFlag(
  request: FastifyRequest,
  data: Omit<NewFeatureFlag, "allowedUsers" | "allowedEnv"> & {
    allowedUsers: string[]
    allowedEnv: string[]
  },
  userId: string
) {
  // Check if feature flag with same name already exists
  const existingFlag = await request.db
    ?.selectFrom("featureFlags")
    .select("id")
    .where("name", "=", data.name)
    .executeTakeFirst()

  if (existingFlag) {
    throw new Error("Feature flag with this name already exists")
  }

  const newFeatureFlag = await request.db
    ?.insertInto("featureFlags")
    .values({
      ...data,
      allowedEnv: sql`${data.allowedEnv}::text[]` as any,
      allowedUsers: sql`${data.allowedUsers}::text[]` as any,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returningAll()
    .executeTakeFirst()

  if (!newFeatureFlag) {
    throw new Error("Failed to create feature flag")
  }

  return newFeatureFlag
}

export async function updateFeatureFlag(
  request: FastifyRequest,
  featureFlagId: string,
  data: Omit<UpdatedFeatureFlag, "allowedUsers" | "allowedEnv"> & {
    allowedUsers: string[]
    allowedEnv: string[]
  },
  userId: string
) {
  // Check if feature flag exists
  const existingFlag = await request.db
    ?.selectFrom("featureFlags")
    .selectAll()
    .where("id", "=", featureFlagId)
    .executeTakeFirst()

  if (!existingFlag) {
    throw new Error("Feature flag not found")
  }

  // If name is being updated, check for conflicts
  if (data.name && data.name !== existingFlag.name) {
    const nameConflict = await request.db
      ?.selectFrom("featureFlags")
      .select("id")
      .where("name", "=", data.name)
      .where("id", "!=", featureFlagId)
      .executeTakeFirst()

    if (nameConflict) {
      throw new Error("Feature flag with this name already exists")
    }
  }

  const updatedFeatureFlag = await request.db
    ?.updateTable("featureFlags")
    .set({
      ...data,
      allowedUsers: sql`${data.allowedUsers}::text[]` as any,
      allowedEnv: sql`${data.allowedEnv}::text[]` as any,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", featureFlagId)
    .returningAll()
    .executeTakeFirst()

  if (!updatedFeatureFlag) {
    throw new Error("Failed to update feature flag")
  }

  return updatedFeatureFlag
}

export async function deleteFeatureFlag(
  request: FastifyRequest,
  featureFlagId: string
) {
  const deletedFeatureFlag = await request.db
    ?.deleteFrom("featureFlags")
    .where("id", "=", featureFlagId)
    .returningAll()
    .executeTakeFirst()

  if (!deletedFeatureFlag) {
    throw new Error("Feature flag not found")
  }

  return deletedFeatureFlag
}

export async function isUserSuperUser(
  request: FastifyRequest,
  userId: string
): Promise<boolean> {
  const user = await request.db
    ?.selectFrom("users")
    .select("isSuperAdmin")
    .where("id", "=", userId)
    .executeTakeFirst()

  return user?.isSuperAdmin || false
}

export function canUserManageFeatureFlags(
  request: FastifyRequest,
  userId: string
): Promise<boolean> {
  // For now, only super users can manage feature flags
  // This can be extended later with more granular permissions
  return isUserSuperUser(request, userId)
}
