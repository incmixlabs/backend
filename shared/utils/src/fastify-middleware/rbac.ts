import type { AuthUser, SubjectTuple } from "@incmix/utils/types"
import { PermissionService } from "@incmix-api/utils/authorization"
import type { KyselyDb, PermissionAction } from "@incmix-api/utils/db-schema"
import type { FastifyReply, FastifyRequest } from "fastify"

declare module "fastify" {
  interface FastifyRequest {
    rbac?: PermissionService
  }
}

export interface RBACOptions {
  action: PermissionAction
  subject: SubjectTuple
  getOrgId?: (request: FastifyRequest) => string | undefined
  getProjectId?: (request: FastifyRequest) => string | undefined
  skipIf?: (request: FastifyRequest) => boolean
}

export function createRBACMiddleware(db: KyselyDb, options: RBACOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip RBAC check if condition is met
    if (options.skipIf?.(request)) {
      return
    }

    const user = request.user as AuthUser | null
    if (!user) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      })
    }

    // Create a mock context for PermissionService
    const context = {
      get: (key: string) => {
        if (key === "user") return user
        if (key === "db") return db
        return undefined
      },
    } as any

    try {
      const rbac = new PermissionService(context)
      request.rbac = rbac

      // Check org permissions
      const orgId = options.getOrgId?.(request)
      if (orgId) {
        const hasPermission = await rbac.hasOrgPermission(
          options.action,
          options.subject,
          orgId
        )

        if (!hasPermission) {
          return reply.status(403).send({
            error: "Forbidden",
            message: `Insufficient permissions to ${options.action} ${options.subject}`,
          })
        }
        return
      }

      // Check project permissions
      const projectId = options.getProjectId?.(request)
      if (projectId) {
        const hasPermission = await rbac.hasProjectPermission(
          options.action,
          options.subject,
          projectId
        )

        if (!hasPermission) {
          return reply.status(403).send({
            error: "Forbidden",
            message: `Insufficient permissions to ${options.action} ${options.subject}`,
          })
        }
        return
      }

      // If no org or project ID, check if user is super admin
      if (!user.isSuperAdmin) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Resource access requires org or project context",
        })
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

export function requireOrgPermission(
  db: KyselyDb,
  action: PermissionAction,
  subject: SubjectTuple
) {
  return createRBACMiddleware(db, {
    action,
    subject,
    getOrgId: (request) => {
      // Try params first, then query, then body
      return (
        (request.params as any)?.orgId ||
        (request.params as any)?.id ||
        (request.query as any)?.orgId ||
        (request.body as any)?.orgId
      )
    },
  })
}

export function requireProjectPermission(
  db: KyselyDb,
  action: PermissionAction,
  subject: SubjectTuple
) {
  return createRBACMiddleware(db, {
    action,
    subject,
    getProjectId: (request) => {
      // Try params first, then query, then body
      return (
        (request.params as any)?.projectId ||
        (request.query as any)?.projectId ||
        (request.body as any)?.projectId
      )
    },
  })
}
