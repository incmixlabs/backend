import { z } from "@hono/zod-openapi"

export const ValueSchema = z.object({
  id: z.string().openapi({ example: "93jpbulpkkavxnz" }),
  value: z.boolean().openapi({ example: true }),
})
export const PasswordValueSchema = z.object({
  id: z.string().openapi({ example: "93jpbulpkkavxnz" }),
  value: z.string().min(1).openapi({ example: "12345678" }),
})

export { UploadFileSchema } from "@incmix-api/utils/zod-schema"
export const OnboardingSchema = z
  .object({
    email: z.email().openapi({ example: "john.doe@example.com" }),
    companyName: z.string().min(1).openapi({ example: "Company Name" }),
    companySize: z.string().min(1).openapi({ example: "Company Size" }),
    teamSize: z.string().min(1).openapi({ example: "Team Size" }),
    purpose: z.string().min(1).openapi({ example: "Purpose" }),
    role: z.string().min(1).openapi({ example: "Role" }),
    manageFirst: z.string().min(1).openapi({ example: "Manage First" }),
    focusFirst: z.string().min(1).openapi({ example: "Focus First" }),
    referralSources: z
      .array(z.string())
      .min(1)
      .openapi({ example: ["Referral Source 1", "Referral Source 2"] }),
  })
  .openapi("OnboardingSchema")

export const OnboardingResponseSchema = z.object({
  email: z
    .string()
    .email()
    .nullable()
    .openapi({ example: "john.doe@example.com" }),
  companyName: z
    .string()
    .min(1)
    .nullable()
    .openapi({ example: "Company Name" }),
  companySize: z
    .string()
    .min(1)
    .nullable()
    .openapi({ example: "Company Size" }),
  teamSize: z.string().min(1).nullable().openapi({ example: "Team Size" }),
  purpose: z.string().min(1).nullable().openapi({ example: "Purpose" }),
  role: z.string().min(1).nullable().openapi({ example: "Role" }),
  manageFirst: z
    .string()
    .min(1)
    .nullable()
    .openapi({ example: "Manage First" }),
  focusFirst: z.string().min(1).nullable().openapi({ example: "Focus First" }),
  referralSources: z
    .array(z.string())
    .min(1)
    .nullable()
    .openapi({ example: ["Referral Source 1", "Referral Source 2"] }),
})

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")

export const IdOrEmailSchema = z
  .object({
    id: z
      .string()
      .nullish()
      .default(null)
      .openapi({ example: "93jpbulpkkavxnz" }),
    email: z
      .email()
      .nullish()
      .default(null)
      .openapi({ example: "john.doe@example.com" }),
  })
  .refine(({ id, email }) => {
    return !!id?.length || !!email?.length
  }, "Provide either ID or Email")

export const IdSchema = z.object({
  id: z
    .string({ message: "ID is required" })
    .openapi({ example: "93jpbulpkkavxnz" }),
})
export const OrgIdSchema = z.object({
  orgId: z.string().optional().openapi({ example: "93jpbulpkkavxnz" }),
})

export const FullNameSchema = z
  .object({
    fullName: z.string().min(1).openapi({ example: "John Doe" }),
  })
  .openapi("Full Name")

export const UserProfileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    profileImage: z.string().nullable().default(null),
    avatar: z.string().nullable().default(null),
    localeId: z.number(),
  })
  .openapi("UserProfile")

export const PermissionSchema = z
  .array(
    z.object({
      action: z.enum(["manage", "create", "read", "update", "delete"]),
      subject: z.string(),
      conditions: z.any().optional(),
    })
  )
  .openapi("Permission")

export const UserProfilePaginatedSchema = z
  .object({
    data: z.array(UserProfileSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("UserProfilePaginated")

export const OptionalPresignedUrlSchema = z
  .object({
    url: z.string().nullable(),
  })
  .openapi("OptionalPresignedUrl")
