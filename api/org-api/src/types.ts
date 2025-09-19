import type { AuthUser } from "@incmix/utils/types"
import type { PermissionService } from "@incmix-api/utils/authorization"
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyRequest } from "fastify"

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser | null
    db: KyselyDb
    rbac?: PermissionService
  }
}

export type Context = FastifyRequest
