import type { JSONSchemaType } from "ajv"

export interface ValidationError {
  field?: string
  message: string
  value?: unknown
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export type AjvSchema<T> = JSONSchemaType<T>

export interface SchemaRegistry {
  [key: string]: AjvSchema<any>
}
