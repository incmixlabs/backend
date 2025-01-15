import { ForbiddenError as CaslError } from "@casl/ability"
import type { ContentfulStatusCode } from "hono/utils/http-status"

class NotFoundError extends Error {
  public status: ContentfulStatusCode = 404
}

class UnauthorizedError extends Error {
  public status: ContentfulStatusCode = 401

  constructor(message = "Authentication Failed") {
    super(message)
  }
}
class ForbiddenError extends Error {
  public status: ContentfulStatusCode = 403

  constructor(message = "Access Denied") {
    super(message)
  }
}

class ServerError extends Error {
  public status: ContentfulStatusCode = 500

  constructor(message = "Internal Server Error") {
    super(message)
  }
}

class UnprocessableEntityError extends Error {
  public status: ContentfulStatusCode = 422
}
class ConflictError extends Error {
  public status: ContentfulStatusCode = 409
}
class PreconditionFailedError extends Error {
  public status: ContentfulStatusCode = 412
}
class BadRequestError extends Error {
  public status: ContentfulStatusCode = 400
}

export {
  BadRequestError,
  CaslError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
}

export * from "./processErrors"
