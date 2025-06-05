import { z } from "@hono/zod-openapi"

export const OnboardingSchema = z
  .object({
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
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
      .string()
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
    .string({ required_error: "ID is required" })
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

export const UploadFileSchema = z
  .object({
    file: z.instanceof(File).openapi({}),
  })
  .openapi("Upload File")
