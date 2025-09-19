import type { AuthUser } from "@incmix/utils/types"
import type { FastifyReply, FastifyRequest } from "fastify"
import { PermissionService } from "../authorization"

declare module "fastify" {
  interface FastifyRequest {
    rbac?: PermissionService
  }
}

export interface RBACOptions {
  skipIf?: (request: FastifyRequest) => boolean
}

export function createRBACMiddleware(options?: RBACOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip RBAC check if condition is met
    if (options?.skipIf?.(request)) {
      return
    }

    const user = request.user as AuthUser | null
    if (!user) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      })
    }

    try {
      const rbac = new PermissionService(request)
      if (request.context) {
        request.context.rbac = rbac
      } else {
        request.context = {
          rbac,
        }
      }
    } catch (error) {
      console.error("RBAC middleware error:", error)
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Permission check failed",
      })
    }
  }
}
