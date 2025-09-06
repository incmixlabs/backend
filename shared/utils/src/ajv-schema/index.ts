import Ajv from "ajv"
import addFormats from "ajv-formats"
import ajvErrors from "ajv-errors"

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  coerceTypes: true,
  strict: false,
  removeAdditional: "all",
})

addFormats(ajv)
ajvErrors(ajv)

export const createValidator = <T = any>(schema: any) => {
  const validate = ajv.compile(schema)
  
  return {
    validate: (data: unknown): data is T => {
      const valid = validate(data)
      if (!valid) {
        throw new Error(
          validate.errors?.map(e => `${e.instancePath} ${e.message}`).join(", ") || "Validation failed"
        )
      }
      return true
    },
    safeParse: (data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
      const valid = validate(data)
      if (valid) {
        return { success: true, data: data as T }
      }
      return {
        success: false,
        errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) || ["Validation failed"],
      }
    },
    parse: (data: unknown): T => {
      const valid = validate(data)
      if (!valid) {
        throw new Error(
          validate.errors?.map(e => `${e.instancePath} ${e.message}`).join(", ") || "Validation failed"
        )
      }
      return data as T
    },
  }
}

export { ajv }

export * from "./projects"
export * from "./files"
export * from "./genai"