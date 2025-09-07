import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"
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

export const zodError = (result: Result, reply: FastifyReply) => {
  if (result.success) return

  return reply.code(422).send({
    ok: false,
    errors: {
      zodError:
        result.error instanceof ZodError ? result.error.flatten() : null,
    },
  })
}

export async function processError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  _sentryFingerPrint?: string[]
): Promise<void> {
  let t: Awaited<ReturnType<typeof useTranslation>>

  try {
    t = await useTranslation(request)
  } catch (_i18nError) {
    // If i18n is not available (e.g., in tests or when skipI18n: true), create a fallback
    t = {
      text: async ({ key }) => key, // Just return the key as fallback
    }
  }

  if (error instanceof NotFoundError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof BadRequestError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof UnauthorizedError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof ForbiddenError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof CaslError) {
    return reply.code(403).send({
      message: error.message,
      status: 403,
    })
  }
  if (error instanceof UnprocessableEntityError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof ConflictError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof PreconditionFailedError) {
    return reply.code(error.status).send({ message: error.message })
  }
  if (error instanceof ForbiddenError)
    return reply.code(403).send({ message: await t.text(ERROR_FORBIDDEN) })

  console.error(error)
  // logSentryError(request, error, sentryFingerPrint)

  const message =
    error instanceof Error && error.message
      ? error.message
      : await t.text(ERROR_SERVER_ERROR)

  return reply.code(500).send({ message })
}
