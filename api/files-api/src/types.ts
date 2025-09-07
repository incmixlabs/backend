import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { Env } from "./env-vars"

export type Bindings = Env
export type FastifyApp = FastifyInstance

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply
