import { ForbiddenError as CaslError } from "@casl/ability"

class NotFoundError extends Error {
  public status: number = 404
}

class UnauthorizedError extends Error {
  public status: number = 401

  constructor(message = "Authentication Failed") {
    super(message)
  }
}
class ForbiddenError extends Error {
  public status: number = 403

  constructor(message = "Access Denied") {
    super(message)
  }
}

class ServerError extends Error {
  public status: number = 500

  constructor(message = "Internal Server Error") {
    super(message)
  }
}

class UnprocessableEntityError extends Error {
  public status: number = 422
}
class ConflictError extends Error {
  public status: number = 409
}
class PreconditionFailedError extends Error {
  public status: number = 412
}
class BadRequestError extends Error {
  public status: number = 400
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
