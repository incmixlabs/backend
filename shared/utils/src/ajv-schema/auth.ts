import Ajv, { type ValidateFunction } from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

// Auth Schemas
export const SignupSchema = {
  type: "object",
  properties: {
    fullName: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
  required: ["fullName", "email", "password"],
  additionalProperties: false,
} as const

export const AuthSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
  required: ["email", "password"],
  additionalProperties: false,
} as const

export const IdOrEmailSchema = {
  type: "object",
  properties: {
    id: { type: "string", nullable: true },
    email: { type: "string", format: "email", nullable: true },
  },
  anyOf: [{ required: ["id"] }, { required: ["email"] }],
  additionalProperties: false,
} as const

export const EmailSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
  },
  required: ["email"],
  additionalProperties: false,
} as const

export const IsEmailVerifiedSchema = {
  type: "object",
  properties: {
    isEmailVerified: { type: "boolean" },
  },
  required: ["isEmailVerified"],
  additionalProperties: false,
} as const

export const MessageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
  additionalProperties: false,
} as const

// Validators
export const validateSignup: ValidateFunction = ajv.compile(SignupSchema)
export const validateAuth: ValidateFunction = ajv.compile(AuthSchema)
export const validateIdOrEmail: ValidateFunction = ajv.compile(IdOrEmailSchema)
export const validateEmail: ValidateFunction = ajv.compile(EmailSchema)
export const validateIsEmailVerified: ValidateFunction = ajv.compile(
  IsEmailVerifiedSchema
)
export const validateMessageResponse: ValidateFunction = ajv.compile(
  MessageResponseSchema
)

// Type definitions
export interface SignupType {
  fullName: string
  email: string
  password: string
}

export interface AuthType {
  email: string
  password: string
}

export interface IdOrEmailType {
  id?: string | null
  email?: string | null
}

export interface EmailType {
  email: string
}

export interface IsEmailVerifiedType {
  isEmailVerified: boolean
}

export interface MessageResponseType {
  message: string
}
