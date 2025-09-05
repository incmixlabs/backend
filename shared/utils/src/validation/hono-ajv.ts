import type { ValidateFunction } from "ajv"
import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"

export interface AjvValidationConfig {
  target?: 'json' | 'query' | 'param' | 'form'
  onError?: (errors: any[], c: Context) => Response
}

export function ajvValidator<T>(
  validator: ValidateFunction,
  config: AjvValidationConfig = {}
) {
  return async (c: Context, next: Next) => {
    const { target = 'json', onError } = config
    let data: unknown

    try {
      switch (target) {
        case 'json':
          data = await c.req.json()
          break
        case 'query':
          data = c.req.query()
          break
        case 'param':
          data = c.req.param()
          break
        case 'form':
          data = await c.req.formData()
          break
        default:
          data = await c.req.json()
      }
    } catch (error) {
      throw new HTTPException(400, { message: 'Invalid request body' })
    }

    const valid = validator(data)

    if (!valid) {
      const errors = validator.errors || []
      
      if (onError) {
        return onError(errors, c)
      }

      // Default error response similar to Zod
      const formattedErrors = errors.map(error => ({
        path: error.instancePath ? error.instancePath.split('/').filter(Boolean) : [error.propertyName || ''].filter(Boolean),
        message: error.message || 'Invalid value',
        code: error.keyword || 'invalid',
        value: error.data
      }))

      throw new HTTPException(422, {
        message: 'Validation failed',
        cause: {
          errors: formattedErrors
        }
      })
    }

    c.set('validatedData', data as T)
    await next()
  }
}

// Helper to get validated data from context
export function getValidatedData<T>(c: Context): T {
  return c.get('validatedData') as T
}

// Utility to validate data without middleware
export function validateData<T>(validator: ValidateFunction, data: unknown): {
  success: true
  data: T
} | {
  success: false
  errors: Array<{
    path: string[]
    message: string
    code: string
    value: unknown
  }>
} {
  const valid = validator(data)
  
  if (valid) {
    return { success: true, data: data as T }
  }

  const errors = (validator.errors || []).map(error => ({
    path: error.instancePath ? error.instancePath.split('/').filter(Boolean) : [error.propertyName || ''].filter(Boolean),
    message: error.message || 'Invalid value',
    code: error.keyword || 'invalid',
    value: error.data
  }))

  return { success: false, errors }
}