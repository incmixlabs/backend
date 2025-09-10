import { z } from "@hono/zod-openapi"

export const MessageSchema = z.object({
  message: z
    .string()
    .openapi({ example: "Feature flag retrieved successfully" }),
})

export const FeatureFlagIdSchema = z
  .object({
    featureFlagId: z.string().openapi({
      example: "uuid-example",
      param: { name: "featureFlagId", in: "path" },
    }),
  })
  .openapi("Feature Flag Params")

export const FeatureFlagSchema = z.object({
  id: z.string().openapi({ example: "uuid-example" }),
  name: z.string().openapi({ example: "new-feature" }),
  description: z
    .string()
    .nullish()
    .openapi({ example: "A new feature description" }),
  enabled: z.boolean().default(true).openapi({ example: true }),
  allowedEnv: z
    .array(z.enum(["all", "dev", "qa", "uat", "test","prod"]))
    .default(["all"])
    .openapi({ example: ["all", "dev"] }),
  allowedUsers: z
    .union([z.literal("all"), z.literal("superusers"), z.string()])
    .array()
    .default(["all"])
    .openapi({
      example: ["all"],
      description: "Can be 'all', 'superusers', or an array of user IDs",
    }),
  createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00.000Z" }),
  updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00.000Z" }),
  createdBy: z.string().openapi({ example: "user-uuid" }),
  updatedBy: z.string().openapi({ example: "user-uuid" }),
})

export const FeatureFlagListSchema = z.array(z.string()).openapi({
  example: ["example-feature-flag-1", "example-feature-flag-2"],
  description: "List of enabled feature flag names",
})

export const CreateFeatureFlagSchema = FeatureFlagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})

export const UpdateFeatureFlagSchema = CreateFeatureFlagSchema.partial()

export const FeatureFlagQuerySchema = z.object({
  env: z
    .enum(["all", "dev", "qa", "uat", "prod", "test"])
    .optional()
    .openapi({
      example: "dev",
      description: "Environment to filter feature flags by",
    }),
})

export const FeatureFlagListResponseSchema = z.array(FeatureFlagSchema)
