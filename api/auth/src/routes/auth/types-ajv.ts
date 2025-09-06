import type { JSONSchemaType } from "ajv"
import { createValidator } from "@incmix-api/utils/ajv-schema"

export interface Signup {
  fullName: string
  email: string
  password: string
}

export const SignupSchema: JSONSchemaType<Signup> = {
  type: "object",
  properties: {
    fullName: { type: "string" },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
  required: ["fullName", "email", "password"],
  additionalProperties: false,
}

export interface Auth {
  email: string
  password: string
}

export const AuthSchema: JSONSchemaType<Auth> = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
  },
  required: ["email", "password"],
  additionalProperties: false,
}

export interface IdOrEmail {
  id?: string | null
  email?: string | null
}

export const IdOrEmailSchema: JSONSchemaType<IdOrEmail> = {
  type: "object",
  properties: {
    id: { type: "string", nullable: true },
    email: { type: "string", format: "email", nullable: true },
  },
  required: [],
  additionalProperties: false,
  anyOf: [
    { required: ["id"] },
    { required: ["email"] }
  ]
}

export interface Email {
  email: string
}

export const EmailSchema: JSONSchemaType<Email> = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
  },
  required: ["email"],
  additionalProperties: false,
}

export interface IsEmailVerified {
  isEmailVerified: boolean
}

export const IsEmailVerifiedSchema: JSONSchemaType<IsEmailVerified> = {
  type: "object",
  properties: {
    isEmailVerified: { type: "boolean" },
  },
  required: ["isEmailVerified"],
  additionalProperties: false,
}

export const SignupValidator = createValidator(SignupSchema)
export const AuthValidator = createValidator(AuthSchema)
export const IdOrEmailValidator = createValidator(IdOrEmailSchema)
export const EmailValidator = createValidator(EmailSchema)
export const IsEmailVerifiedValidator = createValidator(IsEmailVerifiedSchema)