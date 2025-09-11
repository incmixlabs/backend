import type { AuthUser } from "@incmix/utils/types"
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyRequest } from "fastify"

export interface AuditLogEntry {
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId?: string
  orgId?: string
  projectId?: string
  method: string
  path: string
  statusCode?: number
  metadata?: Record<string, any>
  timestamp: string
  ip?: string
  userAgent?: string
}

export interface AuditContext {
  user: AuthUser
  action: string
  resourceType: string
  resourceId?: string
  orgId?: string
  projectId?: string
  metadata?: Record<string, any>
}

export class AuditLogger {
  private db: KyselyDb

  constructor(db: KyselyDb) {
    this.db = db
  }

  async log(
    request: FastifyRequest,
    context: AuditContext,
    statusCode?: number
  ) {
    try {
      const entry: AuditLogEntry = {
        userId: context.user.id,
        userEmail: context.user.email,
        action: context.action,
        resourceType: context.resourceType,
        resourceId: context.resourceId,
        orgId: context.orgId,
        projectId: context.projectId,
        method: request.method,
        path: request.url,
        statusCode,
        metadata: context.metadata,
        timestamp: new Date().toISOString(),
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      }

      // Store in database
      await this.db
        .insertInto("auditLogs")
        .values({
          userId: entry.userId,
          userEmail: entry.userEmail,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          orgId: entry.orgId,
          projectId: entry.projectId,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          metadata: JSON.stringify(entry.metadata),
          timestamp: entry.timestamp,
          ip: entry.ip,
          userAgent: entry.userAgent,
        })
        .execute()

      // Also log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log("[AUDIT]", JSON.stringify(entry, null, 2))
      }
    } catch (error) {
      // Don't let audit logging failures break the request
      console.error("Failed to write audit log:", error)
    }
  }

  async logMutation(
    request: FastifyRequest,
    action: "CREATE" | "UPDATE" | "DELETE",
    resourceType: string,
    resourceId?: string,
    orgId?: string,
    metadata?: Record<string, any>
  ) {
    const user = (request as any).user as AuthUser
    if (!user) {
      console.warn("Attempting to audit log without authenticated user")
      return
    }

    await this.log(
      request,
      {
        user,
        action,
        resourceType,
        resourceId,
        orgId,
        metadata,
      },
      200
    )
  }
}

export function createAuditMiddleware(db: KyselyDb) {
  const auditLogger = new AuditLogger(db)

  return {
    auditLogger,
    middleware: async (request: FastifyRequest) => {
      ;(request as any).audit = auditLogger
    },
  }
}

declare module "fastify" {
  interface FastifyRequest {
    audit?: AuditLogger
  }
}
