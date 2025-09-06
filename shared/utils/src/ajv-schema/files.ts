import { createValidator } from "./index"

export interface UploadFile {
  file: any
}

export const UploadFileSchema = {
  type: "object",
  properties: {
    file: {},
  },
  required: ["file"],
  additionalProperties: false,
}

export const UploadFileValidator = createValidator(UploadFileSchema)