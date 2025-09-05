import Ajv, { type ValidateFunction } from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

// Health Check Schema
export const HealthCheckSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    reason: { type: "string", nullable: true },
  },
  required: ["status"],
  additionalProperties: false,
} as const

// Validators
export const validateHealthCheck: ValidateFunction =
  ajv.compile(HealthCheckSchema)

// Type definitions
export interface HealthCheckType {
  status: string
  reason?: string
}
