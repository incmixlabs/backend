import type { CommonBindings, CommonVariables } from "@incmix-api/utils"
import type { FastifyInstance, FastifyRequest } from "fastify"

export type AppRequest = FastifyRequest
export type Context = FastifyRequest

export type HonoApp = {
  Bindings: CommonBindings
  Variables: CommonVariables
}

export type AppInstance = FastifyInstance
