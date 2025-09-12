import type { Action, Subject } from "@incmix/utils/types"
import { UserRoles } from "@incmix/utils/types"
import type {
  Env as FeatureFlagEnv,
  KyselyDb,
  NewFeatureFlag,
  NewMember,
  NewOrg,
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
import type { FastifyRequest } from "fastify"
import { sql } from "kysely"
import { jsonArrayFrom } from "kysely/helpers/postgres"

// Adapter type to make functions work with both Hono Context and FastifyRequest
type Context =
  | FastifyRequest
  | {
      get: (key: string) => any
    }

// Helper to get database from either Context or FastifyRequest
function getDb(context: Context): KyselyDb {
  if ("context" in context && context.context?.db) {
    return context.context.db
  }
  if ("get" in context) {
    return context.get("db")
  }
  throw new Error("Database not initialized")
}

export async function getUserByEmail(c: Context, email: string) {
  const db = getDb(c)
  return await db
    .selectFrom("userProfiles")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
}
export async function getUserById(c: Context, id: string) {
  const db = getDb(c)
  return await db
    .selectFrom("userProfiles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function isValidUser(c: Context, id: string) {
  const user = await getUserById(c, id)
  return !!user
}

export function findAllRoles(c: Context, orgId?: string) {
  const db = getDb(c)
  let query = db.selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) =>
      eb.or([eb("orgId", "=", orgId), eb("orgId", "is", null)])
    )
  }

  return query.execute()
}

export function findRoleByName(c: Context, name: string, orgId?: string) {
  let query = getDb(c).selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("orgId", "=", orgId), eb("name", "=", name)])
    )
  } else {
    query = query.where("name", "=", name)
  }

  return query.executeTakeFirst()
}

export function findRoleById(c: Context, id: number, orgId?: string) {
  let query = getDb(c).selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("orgId", "=", orgId), eb("id", "=", id)])
    )
  } else {
    query = query.where("id", "=", id)
  }

  return query.executeTakeFirst()
}

export function insertOrg(c: Context, org: NewOrg) {
  const db = getDb(c)
  return db
    .insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()
}

export async function checkHandleAvailability(c: Context, handle: string) {
  const db = getDb(c)
  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()
  if (!org) return true
  return false
}

export async function findOrgByHandle(c: Context, handle: string) {
  const db = getDb(c)
  const org = await db
    .selectFrom("organisations")
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
    throw new NotFoundError("Organization not found")
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}
export async function findOrgByName(c: Context, name: string) {
  const db = getDb(c)
  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("name", "=", name)
    .executeTakeFirst()

  if (!org) {
    throw new NotFoundError("Organization not found")
  }

  return org
}

export function findOrgByUserId(c: Context, userId: string) {
  const db = getDb(c)
  return db
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

export async function findOrgById(c: Context, id: string) {
  const db = getDb(c)
  const org = await db
    .selectFrom("organisations")
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
    throw new NotFoundError("Organization not found")
  }

  const owners = org.members
    .filter((m) => m.role === UserRoles.ROLE_OWNER)
    .map((m) => m.userId)

  return { ...org, owners }
}

export function insertMembers(c: Context, members: NewMember[]) {
  const db = getDb(c)
  return db.insertInto("members").values(members).returningAll().execute()
}

export async function findOrgMemberById(
  c: Context,
  userId: string,
  orgId: string
) {
  const db = getDb(c)
  const member = await db
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

  if (!member?.userId) {
    throw new NotFoundError("User is not a member of this organization")
  }

  return member
}

export function findOrgMembers(c: Context, orgId: string) {
  const db = getDb(c)
  return db
    .selectFrom("members")
    .innerJoin("roles", "roles.id", "members.roleId")
    .innerJoin("userProfiles", "userProfiles.id", "members.userId")
    .select([
      "members.userId",
      "userProfiles.fullName",
      "userProfiles.email",
      "userProfiles.profileImage",
      "userProfiles.avatar",
      "roles.name as role",
    ])
    .where("members.orgId", "=", orgId)
    .execute()
}

export async function ensureAtLeastOneOwner(
  c: Context,
  orgId: string,
  affectedUserIds: string[],
  operation: "remove" | "update"
): Promise<void> {
  const currentMembers = await findOrgMembers(c, orgId)
  const adminMembers = currentMembers.filter(
    (m) => m.role === UserRoles.ROLE_OWNER
  )

  if (operation === "remove") {
    const removingAdmins = affectedUserIds.some((userId) =>
      adminMembers.some((admin) => admin.userId === userId)
    )
    if (removingAdmins && adminMembers.length <= affectedUserIds.length) {
      throw new PreconditionFailedError(
        "Cannot remove the last owner of the organization"
      )
    }
  } else if (operation === "update") {
    if (adminMembers.length === 1) {
      const admin = adminMembers[0]
      if (admin && affectedUserIds.includes(admin.userId)) {
        throw new PreconditionFailedError(
          "Cannot change role of the last owner"
        )
      }
    }
  }
}

export async function doesOrgExist(
  c: Context,
  name: string,
  userId: string
): Promise<boolean> {
  const db = getDb(c)
  const org = await db
    .selectFrom("organisations")
    .select("id")
    .where((eb) => eb.and([eb("name", "=", name)]))
    .executeTakeFirst()

  if (!org) return false

  const members = await findOrgMembers(c, org.id)
  return members.some((m) => m.userId === userId)
}

export function insertRole(c: Context, role: NewRole) {
  const db = getDb(c)
  return db.insertInto("roles").values(role).returningAll().executeTakeFirst()
}

export function updateRoleById(c: Context, role: UpdatedRole, id: number) {
  const db = getDb(c)
  return db
    .updateTable("roles")
    .set(role)
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function deleteRoleById(c: Context, id: number) {
  const db = getDb(c)
  return await db.transaction().execute(async (tx) => {
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
  c: Context,
  subject: Subject,
  action: Action,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? getDb(c))
    .selectFrom("rolePermissions")
    .innerJoin("permissions", "permissions.id", "rolePermissions.permissionId")
    .selectAll()
    .where("permissions.resourceType", "=", subject)
    .where("permissions.action", "=", action)
    .where("rolePermissions.roleId", "=", roleId)
    .executeTakeFirst()
}

export function insertPermission(
  c: Context,
  permission: NewPermission,
  instance?: KyselyDb
) {
  return (instance ?? getDb(c))
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
  return (instance ?? getDb(c))
    .updateTable("permissions")
    .set(permission)
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function deletePermission(
  c: Context,
  id: number,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? getDb(c))
    .deleteFrom("rolePermissions")
    .where((eb) =>
      eb.and([eb("permissionId", "=", id), eb("roleId", "=", roleId)])
    )
    .executeTakeFirstOrThrow()
}

export async function getFeatureFlags(
  c: Context,
  userId: string,
  env?: FeatureFlagEnv
) {
  // First check if user is a superuser
  const isSuperUser = await isUserSuperUser(c, userId)

  const db = getDb(c)
  const query = db
    .selectFrom("featureFlags")
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

  return query.execute()
}

export async function getFeatureFlagById(
  c: Context,
  featureFlagId: string,
  userId: string
) {
  const db = getDb(c)
  const featureFlag = await db
    .selectFrom("featureFlags")
    .selectAll()
    .where("id", "=", featureFlagId)
    .where("enabled", "=", true)
    .executeTakeFirst()

  if (!featureFlag) {
    return null
  }

  // Check if user is a superuser
  const isSuperUser = await isUserSuperUser(c, userId)

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
  c: Context,
  data: Omit<NewFeatureFlag, "allowedUsers" | "allowedEnv"> & {
    allowedUsers: string[]
    allowedEnv: string[]
  },
  userId: string
) {
  // Check if feature flag with same name already exists
  const db = getDb(c)
  const existingFlag = await db
    .selectFrom("featureFlags")
    .select("id")
    .where("name", "=", data.name)
    .executeTakeFirst()

  if (existingFlag) {
    throw new Error("Feature flag with this name already exists")
  }

  const newFeatureFlag = await db
    .insertInto("featureFlags")
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
  c: Context,
  featureFlagId: string,
  data: Omit<UpdatedFeatureFlag, "allowedUsers" | "allowedEnv"> & {
    allowedUsers: string[]
    allowedEnv: string[]
  },
  userId: string
) {
  // Check if feature flag exists
  const db = getDb(c)
  const existingFlag = await db
    .selectFrom("featureFlags")
    .selectAll()
    .where("id", "=", featureFlagId)
    .executeTakeFirst()

  if (!existingFlag) {
    throw new Error("Feature flag not found")
  }

  // If name is being updated, check for conflicts
  if (data.name && data.name !== existingFlag.name) {
    const nameConflict = await db
      .selectFrom("featureFlags")
      .select("id")
      .where("name", "=", data.name)
      .where("id", "!=", featureFlagId)
      .executeTakeFirst()

    if (nameConflict) {
      throw new Error("Feature flag with this name already exists")
    }
  }

  const updatedFeatureFlag = await db
    .updateTable("featureFlags")
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

export async function deleteFeatureFlag(c: Context, featureFlagId: string) {
  const db = getDb(c)
  const deletedFeatureFlag = await db
    .deleteFrom("featureFlags")
    .where("id", "=", featureFlagId)
    .returningAll()
    .executeTakeFirst()

  if (!deletedFeatureFlag) {
    throw new Error("Feature flag not found")
  }

  return deletedFeatureFlag
}

export async function isUserSuperUser(
  c: Context,
  userId: string
): Promise<boolean> {
  const db = getDb(c)
  const user = await db
    .selectFrom("users")
    .select("isSuperAdmin")
    .where("id", "=", userId)
    .executeTakeFirst()

  return user?.isSuperAdmin || false
}

export function canUserManageFeatureFlags(
  c: Context,
  userId: string
): Promise<boolean> {
  // For now, only super users can manage feature flags
  // This can be extended later with more granular permissions
  return isUserSuperUser(c, userId)
}
