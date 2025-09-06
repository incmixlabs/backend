import { useTranslation } from "@incmix-api/utils/middleware"
import type { Context, TypedResponse } from "hono"
import { ERROR_FORBIDDEN, ERROR_SERVER_ERROR } from "../utils/constants"
import {
  BadRequestError,
  CaslError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "./index"

type ValidationResult =
  | {
      success: false
      errors: string[]
    }
  | {
      success: true
      data: unknown
    }

export const validationError = (result: ValidationResult, c: Context) => {
  if (result.success) return

  return c.json(
    {
      ok: false,
      error: "Validation Error",
      issues: result.errors,
    },
    400
  )
}

export function handleBadRequestError(
  c: Context
): TypedResponse<{ ok: boolean; error: string; message?: string }, 400, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Bad Request",
      message: t("errors.badRequest"),
    },
    400
  )
}

export function handleConflictError(
  c: Context,
  message?: string
): TypedResponse<{ ok: boolean; error: string; message?: string }, 409, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Conflict",
      message: message ?? t("errors.conflict"),
    },
    409
  )
}

export function handleForbiddenError(
  c: Context
): TypedResponse<{ ok: boolean; error: string; message?: string }, 403, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: ERROR_FORBIDDEN,
      message: t("errors.forbidden"),
    },
    403
  )
}

export function handleNotFoundError(
  c: Context
): TypedResponse<{ ok: boolean; error: string; message?: string }, 404, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Not Found",
      message: t("errors.notFound"),
    },
    404
  )
}

export function handlePreconditionFailedError(
  c: Context,
  message?: string
): TypedResponse<{ ok: boolean; error: string; message?: string }, 412, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Precondition Failed",
      message: message ?? t("errors.preconditionFailed"),
    },
    412
  )
}

export function handleUnauthorizedError(
  c: Context
): TypedResponse<{ ok: boolean; error: string; message?: string }, 401, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Unauthorized",
      message: t("errors.unauthorized"),
    },
    401
  )
}

export function handleUnprocessableEntityError(
  c: Context,
  message?: string
): TypedResponse<{ ok: boolean; error: string; message?: string }, 422, "json"> {
  const t = useTranslation(c)
  return c.json(
    {
      ok: false,
      error: "Unprocessable Entity",
      message: message ?? t("errors.unprocessableEntity"),
    },
    422
  )
}

export function processError(error: unknown, c: Context): TypedResponse<any> {
  console.error("Processing error:", error)
  const t = useTranslation(c)

  if (error instanceof BadRequestError) {
    return handleBadRequestError(c)
  }

  if (error instanceof ConflictError) {
    return handleConflictError(c, error.message)
  }

  if (error instanceof ForbiddenError) {
    return handleForbiddenError(c)
  }

  if (error instanceof NotFoundError) {
    return handleNotFoundError(c)
  }

  if (error instanceof PreconditionFailedError) {
    return handlePreconditionFailedError(c, error.message)
  }

  if (error instanceof UnauthorizedError) {
    return handleUnauthorizedError(c)
  }

  if (error instanceof UnprocessableEntityError) {
    return handleUnprocessableEntityError(c, error.message)
  }

  if (error instanceof CaslError) {
    return handleForbiddenError(c)
  }

  // Default error handler
  return c.json(
    {
      ok: false,
      error: ERROR_SERVER_ERROR,
      message: t("errors.serverError"),
    },
    500
  )
}