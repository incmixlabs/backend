import type { AjvSchema } from "./types"

export const CommonSchemas = {
  email: {
    type: "string",
    format: "email",
  } as const,

  password: {
    type: "string",
    minLength: 8,
    maxLength: 128,
  } as const,

  uuid: {
    type: "string",
    format: "uuid",
  } as const,

  timestamp: {
    type: "string",
    format: "date-time",
  } as const,

  url: {
    type: "string",
    format: "url",
  } as const,
}

export interface LoginRequest {
  email: string
  password: string
}

export const LoginRequestSchema: AjvSchema<LoginRequest> = {
  type: "object",
  properties: {
    email: CommonSchemas.email,
    password: CommonSchemas.password,
  },
  required: ["email", "password"],
  additionalProperties: false,
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export const RegisterRequestSchema: AjvSchema<RegisterRequest> = {
  type: "object",
  properties: {
    email: CommonSchemas.email,
    password: CommonSchemas.password,
    firstName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    lastName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
  },
  required: ["email", "password", "firstName", "lastName"],
  additionalProperties: false,
}

export interface PasswordResetRequest {
  email: string
}

export const PasswordResetRequestSchema: AjvSchema<PasswordResetRequest> = {
  type: "object",
  properties: {
    email: CommonSchemas.email,
  },
  required: ["email"],
  additionalProperties: false,
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

export const PasswordResetConfirmRequestSchema: AjvSchema<PasswordResetConfirmRequest> =
  {
    type: "object",
    properties: {
      token: {
        type: "string",
        minLength: 1,
      },
      newPassword: CommonSchemas.password,
    },
    required: ["token", "newPassword"],
    additionalProperties: false,
  }
