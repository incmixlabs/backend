import type { Context } from "@/types"
import type {
  Env,
  NewFeatureFlag,
  UpdatedFeatureFlag,
} from "@incmix-api/utils/db-schema"
import { sql } from "kysely"

export async function getFeatureFlags(c: Context, userId: string, env?: Env) {
  // First check if user is a superuser
  const isSuperUser = await isUserSuperUser(c, userId)

  const query = c
    .get("db")
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
  const featureFlag = await c
    .get("db")
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
  const existingFlag = await c
    .get("db")
    .selectFrom("featureFlags")
    .select("id")
    .where("name", "=", data.name)
    .executeTakeFirst()

  if (existingFlag) {
    throw new Error("Feature flag with this name already exists")
  }

  const newFeatureFlag = await c
    .get("db")
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
  const existingFlag = await c
    .get("db")
    .selectFrom("featureFlags")
    .selectAll()
    .where("id", "=", featureFlagId)
    .executeTakeFirst()

  if (!existingFlag) {
    throw new Error("Feature flag not found")
  }

  // If name is being updated, check for conflicts
  if (data.name && data.name !== existingFlag.name) {
    const nameConflict = await c
      .get("db")
      .selectFrom("featureFlags")
      .select("id")
      .where("name", "=", data.name)
      .where("id", "!=", featureFlagId)
      .executeTakeFirst()

    if (nameConflict) {
      throw new Error("Feature flag with this name already exists")
    }
  }

  const updatedFeatureFlag = await c
    .get("db")
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
  const deletedFeatureFlag = await c
    .get("db")
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
  const user = await c
    .get("db")
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
