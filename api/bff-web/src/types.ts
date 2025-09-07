import type { FastifyReply, FastifyRequest } from "fastify"
import type { Env } from "./env-vars"

export type Bindings = Env
export type Variables = {}

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply
