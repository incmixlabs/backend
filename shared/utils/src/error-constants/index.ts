export interface ErrorConstant {
  namespace: string
  key: string
}

export class ErrorConstants {
  constructor(private namespace = "errors") {}

  notFound(entity: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key: `${entity}_not_found`,
    }
  }

  alreadyExists(entity: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key: `${entity}_already_exists`,
    }
  }

  invalidInput(field?: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key: field ? `invalid_${field}` : "invalid_input",
    }
  }

  unauthorized(): ErrorConstant {
    return {
      namespace: this.namespace,
      key: "unauthorized",
    }
  }

  forbidden(): ErrorConstant {
    return {
      namespace: this.namespace,
      key: "forbidden",
    }
  }

  validationFailed(field?: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key: field ? `${field}_validation_failed` : "validation_failed",
    }
  }

  operationFailed(operation: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key: `${operation}_failed`,
    }
  }

  custom(key: string): ErrorConstant {
    return {
      namespace: this.namespace,
      key,
    }
  }
}

// Pre-configured error constant generators for common services
export const authErrors = new ErrorConstants("auth_errors")
export const userErrors = new ErrorConstants("user_errors")
export const projectErrors = new ErrorConstants("project_errors")
export const taskErrors = new ErrorConstants("task_errors")
export const orgErrors = new ErrorConstants("org_errors")
export const fileErrors = new ErrorConstants("file_errors")

// Common generic errors
export const commonErrors = {
  INTERNAL_SERVER_ERROR: {
    namespace: "errors",
    key: "internal_server_error",
  },
  BAD_REQUEST: {
    namespace: "errors",
    key: "bad_request",
  },
  NOT_FOUND: {
    namespace: "errors",
    key: "not_found",
  },
  UNAUTHORIZED: {
    namespace: "errors",
    key: "unauthorized",
  },
  FORBIDDEN: {
    namespace: "errors",
    key: "forbidden",
  },
  CONFLICT: {
    namespace: "errors",
    key: "conflict",
  },
  UNPROCESSABLE_ENTITY: {
    namespace: "errors",
    key: "unprocessable_entity",
  },
  TOO_MANY_REQUESTS: {
    namespace: "errors",
    key: "too_many_requests",
  },
  SERVICE_UNAVAILABLE: {
    namespace: "errors",
    key: "service_unavailable",
  },
}

export type ErrorCode = 404 | 401 | 403 | 400 | 409 | 412 | 422 | 500
interface ErrorStatus {
  code: number
  message: string
}
export const errorStatuses: Record<string, ErrorStatus> = {
  NotFound: {
    code: 404,
    message: "NotFound",
  },
  Unauthorized: {
    code: 401,
    message: "Unauthorized",
  },
  Forbidden: {
    code: 403,
    message: "Forbidden",
  },
  BadRequest: {
    code: 400,
    message: "BadRequest",
  },
  Conflict: {
    code: 409,
    message: "Conflict",
  },
  PreconditionFailed: {
    code: 412,
    message: "PreconditionFailed",
  },
  UnprocessableEntity: {
    code: 422,
    message: "UnprocessableEntity",
  },
  ServerError: {
    code: 500,
    message: "ServerError",
  },
}
