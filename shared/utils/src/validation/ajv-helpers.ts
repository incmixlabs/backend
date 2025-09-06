import type { ValidateFunction } from "ajv"
import type { Context } from "hono"

export interface AjvValidationResult {
  success: boolean
  data?: unknown
  error?: {
    issues: Array<{
      path: string[]
      message: string
      code: string
    }>
  }
}

export function validateWithAjv<T>(
  validator: ValidateFunction,
  data: unknown
): AjvValidationResult {
  const valid = validator(data)

  if (valid) {
    return {
      success: true,
      data: data as T,
    }
  }

  const issues = (validator.errors || []).map((error) => ({
    path: error.instancePath
      ? error.instancePath.split("/").filter(Boolean)
      : [error.propertyName || ""].filter(Boolean),
    message: error.message || "Invalid value",
    code: error.keyword || "invalid",
  }))

  return {
    success: false,
    error: { issues },
  }
}

export function ajvError(result: AjvValidationResult, c: Context) {
  if (result.success) return

  return c.json(
    {
      ok: false,
      errors: {
        validationError: result.error?.issues || [],
      },
    },
    422
  )
}

export function createAjvMiddleware<T>(validator: ValidateFunction) {
  return (target: string = "json") => {
    return async (c: Context, next: () => Promise<void>) => {
      let data: unknown

      switch (target) {
        case "json":
          data = await c.req.json().catch(() => ({}))
          break
        case "query":
          data = c.req.query()
          break
        case "param":
          data = c.req.param()
          break
        default:
          data = await c.req.json().catch(() => ({}))
      }

      const result = validateWithAjv<T>(validator, data)

      if (!result.success) {
        return ajvError(result, c)
      }

      c.set("validatedData", result.data)
      await next()
    }
  }
}
