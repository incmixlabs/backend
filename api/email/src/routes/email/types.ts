import type { emailTemplateNames } from "@incmix-api/utils/db-schema"
import { z } from "zod"

export const VerificationEmailSchema = z.object({
  payload: z.object({
    verificationLink: z.string().min(1),
  }),
  template: z.literal<(typeof emailTemplateNames)[0]>("VerificationEmail"),
})

export const ResetPasswordSchema = z.object({
  payload: z.object({
    resetPasswordLink: z.string(),
    username: z.string(),
  }),
  template: z.literal<(typeof emailTemplateNames)[1]>("ResetPasswordEmail"),
})

export const MessageResponseSchema = z.object({
  message: z.string(),
})

export const RequestSchema = z.object({
  recipient: z.string().email(),
  body: VerificationEmailSchema.or(ResetPasswordSchema),
  requestedBy: z.string(),
})
