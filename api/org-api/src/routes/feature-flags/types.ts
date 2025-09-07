import { z } from "zod"

export const MessageSchema = z.object({
  message: z.string(),
})

export const FeatureFlagIdSchema = z.object({
  featureFlagId: z.string(),
})

export const FeatureFlagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  enabled: z.boolean().default(true),
  allowedEnv: z
    .array(z.enum(["all", "development", "staging", "production"]))
    .default(["all"]),
  allowedUsers: z
    .union([z.literal("all"), z.literal("superusers"), z.string()])
    .array()
    .default(["all"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export const FeatureFlagListSchema = z.array(z.string())

export const CreateFeatureFlagSchema = FeatureFlagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})

export const UpdateFeatureFlagSchema = CreateFeatureFlagSchema.partial()

export const FeatureFlagQuerySchema = z.object({
  env: z.enum(["all", "development", "staging", "production"]).optional(),
})

export const FeatureFlagListResponseSchema = z.array(FeatureFlagSchema)
