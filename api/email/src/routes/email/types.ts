// Response schema based on SendEmailResponse from api/email/src/lib/helper.ts
export const MessageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    id: { type: "string" },
    status: { type: "number" },
    title: { type: "string" },
    type: { type: "string" },
  },
  required: ["message", "status"],
  additionalProperties: false,
} as const

// Template-specific payload schemas
const VerificationEmailPayloadSchema = {
  type: "object",
  properties: {
    verificationLink: { type: "string", format: "uri" },
  },
  required: ["verificationLink"],
  additionalProperties: false,
} as const

const ResetPasswordEmailPayloadSchema = {
  type: "object",
  properties: {
    resetPasswordLink: { type: "string", format: "uri" },
    username: { type: "string", minLength: 1 },
  },
  required: ["resetPasswordLink", "username"],
  additionalProperties: false,
} as const

// Request schema with template validation
export const RequestSchema = {
  type: "object",
  properties: {
    recipient: {
      type: "string",
      format: "email",
    },
    requestedBy: {
      type: "string",
      minLength: 1,
    },
    body: {
      oneOf: [
        {
          type: "object",
          properties: {
            template: { const: "VerificationEmail" },
            payload: VerificationEmailPayloadSchema,
          },
          required: ["template", "payload"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            template: { const: "ResetPasswordEmail" },
            payload: ResetPasswordEmailPayloadSchema,
          },
          required: ["template", "payload"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ["recipient", "body", "requestedBy"],
  additionalProperties: false,
} as const

// Export types for TypeScript usage
export type VerificationEmailPayload = {
  verificationLink: string
}

export type ResetPasswordEmailPayload = {
  resetPasswordLink: string
  username: string
}

export type EmailRequestBody =
  | {
      template: "VerificationEmail"
      payload: VerificationEmailPayload
    }
  | {
      template: "ResetPasswordEmail"
      payload: ResetPasswordEmailPayload
    }

export type EmailRequest = {
  recipient: string
  body: EmailRequestBody
  requestedBy: string
}
