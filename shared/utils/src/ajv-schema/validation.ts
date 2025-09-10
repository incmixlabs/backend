import Ajv from "ajv"
import addFormats from "ajv-formats"
import type { AjvSchema, ValidationError, ValidationResult } from "./types"

export class AjvValidator {
  private ajv: Ajv

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
    })
    addFormats(this.ajv)
  }

  validate<T>(schema: AjvSchema<T>, data: unknown): ValidationResult<T> {
    const validate = this.ajv.compile(schema)
    const valid = validate(data)

    if (valid) {
      return {
        success: true,
        data: data as T,
      }
    }

    const errors: ValidationError[] = (validate.errors || []).map((error) => ({
      field: error.instancePath || error.schemaPath,
      message: error.message || "Validation error",
      value: error.data,
    }))

    return {
      success: false,
      errors,
    }
  }

  compile<T>(schema: AjvSchema<T>) {
    return this.ajv.compile(schema)
  }

  addSchema<T>(schema: AjvSchema<T>, key: string) {
    this.ajv.addSchema(schema, key)
    return this
  }

  getSchema(key: string) {
    return this.ajv.getSchema(key)
  }
}

export const validator = new AjvValidator()
