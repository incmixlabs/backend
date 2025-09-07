import type { FastifyApp, FastifyContext } from "@incmix-api/utils"
import type { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply
export type HonoApp = FastifyApp
export type Context = FastifyContext

export const MessageResponseSchema = z.object({
  message: z.string(),
})
