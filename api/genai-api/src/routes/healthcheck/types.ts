import type { JSONSchemaType } from "ajv"

export interface HealthCheck {
  status: string
  reason?: string
}

export const HealthCheckSchema: JSONSchemaType<HealthCheck> = {
  type: "object",
  properties: {
    status: {
      type: "string",
      example: "UP",
    },
    reason: {
      type: "string",
      example: "Database down",
      nullable: true,
    },
  },
  required: ["status"],
  additionalProperties: false,
}
