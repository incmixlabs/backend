import { z } from "zod"

export const ValueSchema = z.object({
  id: z.string(),
  value: z.boolean(),
})
export const PasswordValueSchema = z.object({
  id: z.string(),
  value: z.string().min(1),
})

export { UploadFileSchema } from "@incmix-api/utils/zod-schema"
export const OnboardingSchema = z.object({
  email: z.email(),
  companyName: z.string().min(1),
  companySize: z.string().min(1),
  teamSize: z.string().min(1),
  purpose: z.string().min(1),
  role: z.string().min(1),
  manageFirst: z.string().min(1),
  focusFirst: z.string().min(1),
  referralSources: z.array(z.string()).min(1),
})

export const OnboardingResponseSchema = z.object({
  email: z.string().email().nullable(),
  companyName: z.string().min(1).nullable(),
  companySize: z.string().min(1).nullable(),
  teamSize: z.string().min(1).nullable(),
  purpose: z.string().min(1).nullable(),
  role: z.string().min(1).nullable(),
  manageFirst: z.string().min(1).nullable(),
  focusFirst: z.string().min(1).nullable(),
  referralSources: z.array(z.string()).min(1).nullable(),
})

export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>

export const MessageResponseSchema = z.object({
  message: z.string(),
})

export const IdOrEmailSchema = z
  .object({
    id: z.string().nullish().default(null),
    email: z.email().nullish().default(null),
  })
  .refine(({ id, email }) => {
    return !!id?.length || !!email?.length
  }, "Provide either ID or Email")

export const IdSchema = z.object({
  id: z.string({ message: "ID is required" }),
})
export const OrgIdSchema = z.object({
  orgId: z.string().optional(),
})

export const FullNameSchema = z.object({
  fullName: z.string().min(1),
})

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  profileImage: z.string().nullable().default(null),
  avatar: z.string().nullable().default(null),
  localeId: z.number(),
})

export const PermissionSchema = z.array(
  z.object({
    action: z.enum(["manage", "create", "read", "update", "delete"]),
    subject: z.string(),
    conditions: z.any().optional(),
  })
)

export const UserProfilePaginatedSchema = z.object({
  data: z.array(UserProfileSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const OptionalPresignedUrlSchema = z.object({
  url: z.string().nullable(),
})
