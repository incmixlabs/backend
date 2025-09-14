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

export const MessageResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Success",
    },
  },
  required: ["message"],
}

export const RequestSchema = {
  type: "object",
  properties: {
    recipient: {
      type: "string",
      format: "email",
      example: "john.doe@example.com",
    },
    body: {
      oneOf: [
        {
          type: "object",
          properties: {
            payload: {
              type: "object",
              properties: {
                verificationLink: {
                  type: "string",
                  minLength: 1,
                  example:
                    "https://example.com/verify?code=1234asdf&email=john.doe@example.com",
                },
              },
              required: ["verificationLink"],
            },
            template: {
              type: "string",
              enum: ["VerificationEmail"],
              example: "VerificationEmail",
            },
          },
          required: ["payload", "template"],
        },
        {
          type: "object",
          properties: {
            payload: {
              type: "object",
              properties: {
                resetPasswordLink: {
                  type: "string",
                  example:
                    "https://example.com/reset-password?code=1234asdf&email=john.doe@example.com",
                },
                username: {
                  type: "string",
                  example: "John Doe",
                },
              },
              required: ["resetPasswordLink", "username"],
            },
            template: {
              type: "string",
              enum: ["ResetPasswordEmail"],
              example: "ResetPasswordEmail",
            },
          },
          required: ["payload", "template"],
        },
      ],
    },
    requestedBy: {
      type: "string",
      example: "lamwdlm121",
    },
  },
  required: ["recipient", "body", "requestedBy"],
}
