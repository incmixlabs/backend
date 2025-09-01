import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Context } from "hono"
import type { Kysely } from "kysely"
// Redis client type - define as any to avoid redis package dependency
export type RedisClientType = any

// Common service bindings used across all services
export interface ServiceBindings {
  DATABASE_URL: string
  REDIS_URL?: string
  SENTRY_DSN?: string
  NODE_ENV?: string
  PORT: number
  COOKIE_NAME?: string
  DOMAIN?: string
  FRONTEND_URL?: string
  API_URL?: string
  AUTH_API_URL?: string
  INTL_API_URL?: string
  ORG_API_URL?: string
  EMAIL_API_URL?: string
  GENAI_API_URL?: string
  FILES_API_URL?: string
  PROJECTS_API_URL?: string
  USERS_API_URL?: string
  COMMENTS_API_URL?: string
  LOCATION_API_URL?: string
  RXDB_API_URL?: string
  BFF_WEB_URL?: string
}

// Common service variables
export interface ServiceVariables {
  db: Kysely<any>
  redis?: RedisClientType
  requestId?: string
  user?: ServiceUser
  locale?: string
  i18n?: any
  kvStore?: any
}

// Common user type
export interface ServiceUser {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: string
  permissions?: string[]
  organizationId?: string
  projectIds?: string[]
  [key: string]: any
}

// Standard service app type
export type StandardServiceApp<
  TBindings extends ServiceBindings = ServiceBindings,
  TVariables extends ServiceVariables = ServiceVariables,
> = OpenAPIHono<{
  Bindings: TBindings
  Variables: TVariables
}>

// Standard service context type
export type StandardServiceContext<
  TBindings extends ServiceBindings = ServiceBindings,
  TVariables extends ServiceVariables = ServiceVariables,
> = Context<{
  Bindings: TBindings
  Variables: TVariables
}>

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Standard API response types
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// Health check response type
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy"
  service: string
  version?: string
  timestamp: number
  checks?: {
    database?: boolean
    redis?: boolean
    [key: string]: boolean | undefined
  }
}
