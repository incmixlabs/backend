import { z } from "@hono/zod-openapi"
import type { PermissionService } from "@incmix-api/utils/authorization"
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

interface User {
  id: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
  [key: string]: any
}

type Variables = {
  user?: User
  db: KyselyDb
  rbac: PermissionService
  redis?: any
  requestId?: string
  locale?: string
  i18n?: any
  kvStore?: any
}

export type HonoApp = { Bindings: Env; Variables: Variables }
export type Context = HonoContext<HonoApp>

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")
