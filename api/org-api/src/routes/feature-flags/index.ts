import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_CASL_FORBIDDEN, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  NotFoundError,
  processError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { FEATURE_FLAG_NOT_FOUND } from "@/lib/constants"
import {
  canUserManageFeatureFlags,
  createFeatureFlag as createFeatureFlagDb,
  deleteFeatureFlag as deleteFeatureFlagDb,
  getFeatureFlagById as getFeatureFlagByIdDb,
  getFeatureFlags as getFeatureFlagsDb,
  updateFeatureFlag as updateFeatureFlagDb,
} from "@/lib/db"
import {
  createFeatureFlag,
  deleteFeatureFlag,
  getFeatureFlagById,
  listFeatureFlags,
  updateFeatureFlag,
} from "@/routes/feature-flags/openapi"
import type { HonoApp } from "@/types"

const featureFlagsRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

// List feature flags
featureFlagsRoutes.openapi(listFeatureFlags, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { env } = c.req.valid("query")
    const featureFlags = await getFeatureFlagsDb(c, user.id, env)

    return c.json(
      featureFlags.map((featureFlag) => featureFlag.name),
      200
    )
  } catch (error) {
    return await processError<typeof listFeatureFlags>(c, error, [
      "{{ default }}",
      "list-feature-flags",
    ])
  }
})

// Get feature flag by ID
featureFlagsRoutes.openapi(getFeatureFlagById, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { featureFlagId } = c.req.valid("param")
    const featureFlag = await getFeatureFlagByIdDb(c, featureFlagId, user.id)

    if (!featureFlag) {
      const msg = await t.text(FEATURE_FLAG_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    return c.json(featureFlag, 200)
  } catch (error) {
    return await processError<typeof getFeatureFlagById>(c, error, [
      "{{ default }}",
      "get-feature-flag",
    ])
  }
})

// Create feature flag
featureFlagsRoutes.openapi(createFeatureFlag, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    // Check if user can manage feature flags
    const canManage = await canUserManageFeatureFlags(c, user.id)
    if (!canManage) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const data = c.req.valid("json")

    const newFeatureFlag = await createFeatureFlagDb(
      c,
      {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        updatedBy: user.id,
      },
      user.id
    )

    return c.json(newFeatureFlag, 201)
  } catch (error) {
    return await processError<typeof createFeatureFlag>(c, error, [
      "{{ default }}",
      "create-feature-flag",
    ])
  }
})

// Update feature flag
featureFlagsRoutes.openapi(updateFeatureFlag, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    // Check if user can manage feature flags
    const canManage = await canUserManageFeatureFlags(c, user.id)
    if (!canManage) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const { featureFlagId } = c.req.valid("param")
    const data = c.req.valid("json")

    const updatedFeatureFlag = await updateFeatureFlagDb(
      c,
      featureFlagId,
      {
        ...data,
        allowedUsers: data.allowedUsers || [],
        allowedEnv: data.allowedEnv || [],
      },
      user.id
    )

    return c.json(updatedFeatureFlag, 200)
  } catch (error) {
    return await processError<typeof updateFeatureFlag>(c, error, [
      "{{ default }}",
      "update-feature-flag",
    ])
  }
})

// Delete feature flag
featureFlagsRoutes.openapi(deleteFeatureFlag, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    // Check if user can manage feature flags
    const canManage = await canUserManageFeatureFlags(c, user.id)
    if (!canManage) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN)
      throw new UnauthorizedError(msg)
    }

    const { featureFlagId } = c.req.valid("param")
    await deleteFeatureFlagDb(c, featureFlagId)

    return c.json({ message: "Feature flag deleted successfully" }, 200)
  } catch (error) {
    return await processError<typeof deleteFeatureFlag>(c, error, [
      "{{ default }}",
      "delete-feature-flag",
    ])
  }
})

export default featureFlagsRoutes
