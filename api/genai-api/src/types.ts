import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { Env } from "./env-vars"

export type Bindings = Env

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply

// Fastify app type with proper type providers
export type HonoApp = FastifyInstance<any, any, any, any, ZodTypeProvider>

export type Context = FastifyRequest
