import { z } from "@hono/zod-openapi"
import type { PermissionService } from "@incmix-api/utils/auth"
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

type Variables = {
  user: User | null
  db: KyselyDb
  rbac: PermissionService
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
