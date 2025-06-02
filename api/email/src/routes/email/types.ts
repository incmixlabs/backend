import { z } from "@hono/zod-openapi"
import type { emailTemplateNames } from "@incmix-api/utils/db-schema"

export const VerificationEmailSchema = z
  .object({
    payload: z.object({
      verificationLink: z.string().min(1).openapi({
        example:
          "https://example.com/verify?code=1234asdf&email=john.doe@example.com",
      }),
    }),
    template: z
      .literal<(typeof emailTemplateNames)[0]>("VerificationEmail")
      .openapi({ example: "VerificationEmail" }),
  })
  .openapi("Verification Email Schema")

export const ResetPasswordSchema = z
  .object({
    payload: z.object({
      resetPasswordLink: z.string().openapi({
        example:
          "https://example.com/reset-password?code=1234asdf&email=john.doe@example.com",
      }),
      username: z.string().openapi({ example: "John Doe" }),
    }),
    template: z
      .literal<(typeof emailTemplateNames)[1]>("ResetPasswordEmail")
      .openapi({ example: "ResetPasswordEmail" }),
  })
  .openapi("Reset Password Schema")

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Success" }),
  })
  .openapi("Message Response Schema")

export const RequestSchema = z
  .object({
    recipient: z.string().email().openapi({ example: "john.doe@example.com" }),
    body: VerificationEmailSchema.or(ResetPasswordSchema),
  })
  .openapi("Request Schema")
