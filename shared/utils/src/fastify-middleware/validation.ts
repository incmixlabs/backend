import type { FastifyReply, FastifyRequest } from "fastify"
import type { AjvSchema } from "../ajv-schema/types"
import { validator } from "../ajv-schema/validation"

export interface ValidationOptions {
  body?: AjvSchema<any>
  query?: AjvSchema<any>
  params?: AjvSchema<any>
  headers?: AjvSchema<any>
}

export function createValidationMiddleware(options: ValidationOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const errors: Array<{ location: string; errors: any[] }> = []

    if (options.body) {
      const result = validator.validate(options.body, request.body)
      if (!result.success) {
        errors.push({ location: "body", errors: result.errors || [] })
      } else {
        request.body = result.data
      }
    }

    if (options.query) {
      const result = validator.validate(options.query, request.query)
      if (!result.success) {
        errors.push({ location: "query", errors: result.errors || [] })
      } else {
        request.query = result.data
      }
    }

    if (options.params) {
      const result = validator.validate(options.params, request.params)
      if (!result.success) {
        errors.push({ location: "params", errors: result.errors || [] })
      } else {
        request.params = result.data
      }
    }

    if (options.headers) {
      const result = validator.validate(options.headers, request.headers)
      if (!result.success) {
        errors.push({ location: "headers", errors: result.errors || [] })
      }
    }

    if (errors.length > 0) {
      return reply.status(422).send({
        error: "Validation Error",
        details: errors,
      })
    }
  }
}
