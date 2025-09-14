import type { RouteConfig, RouteConfigToTypedResponse } from "@hono/zod-openapi"
import type { Context, TypedResponse } from "hono"
import { ZodError } from "zod"
import { useTranslation } from "../middleware"
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

type Result =
  | {
      success: false
      error: ZodError
    }
  | {
      success: true
      data: unknown
    }

export const zodError = (result: Result, c: Context) => {
  if (result.success) return

  return c.json(
    {
      ok: false,
      errors: {
        zodError:
          result.error instanceof ZodError ? result.error.flatten() : null,
      },
    },
    422
  )
}

export async function processError<R extends RouteConfig>(
  c: Context,
  error: unknown,
  _sentryFingerPrint?: string[]
): Promise<RouteConfigToTypedResponse<R>> {
  const t = await useTranslation(c)

  if (error instanceof NotFoundError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof BadRequestError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof UnauthorizedError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof ForbiddenError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof CaslError) {
    return c.json({
      message: error.message,
      status: 403,
    }) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof UnprocessableEntityError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof ConflictError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof PreconditionFailedError) {
    return c.json(
      { message: error.message },
      error.status
    ) as TypedResponse as RouteConfigToTypedResponse<R>
  }
  if (error instanceof ForbiddenError)
    return c.json(
      { message: await t.text(ERROR_FORBIDDEN) },
      403
    ) as TypedResponse as RouteConfigToTypedResponse<R>

  console.error(error)
  // logSentryError(c, error, sentryFingerPrint)

  const message =
    error instanceof Error && error.message
      ? error.message
      : await t.text(ERROR_SERVER_ERROR)

  return c.json(
    { message },
    500
  ) as TypedResponse as RouteConfigToTypedResponse<R>
}
