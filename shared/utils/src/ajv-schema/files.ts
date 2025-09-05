import Ajv from "ajv"

const ajv = new Ajv({ allErrors: true, strict: false })

export const UploadFileSchema = {
  type: "object",
  properties: {
    file: {
      type: "object",
      description: "File to upload"
    }
  },
  required: ["file"],
  additionalProperties: false
} as const

export const validateUploadFile = ajv.compile(UploadFileSchema)