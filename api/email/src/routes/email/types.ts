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
    message: { type: "string", example: "Email Sent" },
    id: { type: "string", nullable: true },
    status: { type: "number", example: 200 },
    title: { type: "string", nullable: true },
    type: { type: "string", nullable: true },
  },
  required: ["message", "status"],
} as const

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
          additionalProperties: false,
          properties: {
            payload: {
              type: "object",
              additionalProperties: false,
              properties: {
                verificationLink: {
                  type: "string",
                  format: "uri",
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
          additionalProperties: false,
          properties: {
            payload: {
              type: "object",
              additionalProperties: false,
              properties: {
                resetPasswordLink: {
                  type: "string",
                  format: "uri",
                  example:
                    "https://example.com/reset-password?code=1234asdf&email=john.doe@example.com",
                },
                username: {
                  type: "string",
                  minLength: 1,
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
      minLength: 1,
      example: "lamwdlm121",
    },
  },
  required: ["recipient", "body", "requestedBy"],
  additionalProperties: false,
}
