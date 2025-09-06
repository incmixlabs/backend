import type { JSONSchemaType } from "ajv"

export interface Response {
  message: string
}

export const ResponseSchema: JSONSchemaType<Response> = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Successful",
    },
  },
  required: ["message"],
  additionalProperties: false,
}
