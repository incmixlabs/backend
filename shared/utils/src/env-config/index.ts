import path from "node:path"
import { fileURLToPath } from "node:url"
import { load } from "dotenv-mono"
import { z } from "zod"

// Default ports for each service
const SERVICE_PORTS = {
  auth: 8787,
  email: 8989,
  genai: 8383,
  files: 8282,
  location: 9494,
  bff: 8080,
  comments: 8081,
  intl: 9090,
  org: 9292,
  permissions: 9393,
  projects: 9494,
  tasks: 9595,
  users: 9696,
  rxdb: 9797,
} as const

// Helper function to build API URLs with DOMAIN
function buildApiUrl(port: number, path: string, domain?: string): string {
  const baseDomain = domain || "http://localhost"
  // If domain doesn't include protocol, add http://
  const fullDomain = baseDomain.includes("://")
    ? baseDomain
    : `http://${baseDomain}`
  return `${fullDomain}:${port}${path}`
}

// Base environment schema shared across all services
const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  SENTRY_DSN: z.url().optional(),
  FRONTEND_URL: z.url().optional(),
  API_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  DOMAIN: z.string().default("http://localhost"),
  EMAIL_API_URL: z.string().optional(),
  AUTH_API_URL: z.string().optional(),
  INTL_API_URL: z.string().optional(),
  USERS_API_URL: z.string().optional(),
  COOKIE_NAME: z.string().default("incmix_session"),
  GOOGLE_REDIRECT_URL: z.url(),
  MOCK_ENV: z.string().default("false"),
  LOCATION_API_URL: z.string().optional(),
  GENAI_API_URL: z.string().optional(),
  FILES_API_URL: z.string().optional(),
  BFF_API_URL: z.string().optional(),
  COMMENTS_API_URL: z.string().optional(),
  ORG_API_URL: z.string().optional(),
  PERMISSIONS_API_URL: z.string().optional(),
  PROJECTS_API_URL: z.string().optional(),
  TASKS_API_URL: z.string().optional(),
  RXDB_API_URL: z.string().optional(),
})

// Service-specific schema extensions
const serviceSchemas = {
  auth: z.object({
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default("7d"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.auth),
  }),
  email: z.object({
    EMAIL_FROM: z.email(),
    RESEND_API_KEY: z.string(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.email),
  }),
  genai: z.object({
    OPENAI_API_KEY: z.string(),
    OPENAI_MODEL: z.string().default("gpt-4"),
    FIGMA_ACCESS_TOKEN: z.string().optional(),
    FIGMA_TOKEN: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.genai),
  }),
  files: z.object({
    STORAGE_TYPE: z.enum(["local", "s3"]).default("local"),
    UPLOAD_DIR: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    BUCKET_NAME: z.string().optional(),
    AWS_ENDPOINT_URL_S3: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.files),
  }),
  location: z.object({
    OPENWEATHER_API_KEY: z.string().optional(),
    NEWS_API_KEY: z.string().optional(),
    LOCATION_API_KEY: z.string(),
    LOCATION_URL: z.string(),
    WEATHER_API_KEY: z.string(),
    WEATHER_URL: z.string(),
    SERP_API_KEY: z.string(),
    SERP_NEWS_URL: z.string(),
    PORT: z.coerce.number().default(SERVICE_PORTS.location),
  }),
  bff: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.bff),
  }),
  comments: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.comments),
  }),
  intl: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.intl),
  }),
  org: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.org),
  }),
  permissions: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.permissions),
  }),
  projects: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.projects),
  }),
  tasks: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.tasks),
  }),
  users: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.users),
  }),
  rxdb: z.object({
    PORT: z.coerce.number().default(SERVICE_PORTS.rxdb),
  }),
}

export type ServiceName = keyof typeof serviceSchemas

export function createEnvConfig<T extends ServiceName>(
  serviceName?: T,
  customSchema?: z.ZodObject<any>
) {
  // Load environment variables using dotenv-mono
  // This will merge root .env with service-specific .env and NODE_ENV specific files
  const nodeEnv = process.env.NODE_ENV || "development"

  // Get the directory of the current module
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  // Find the backend root directory (4 levels up from utils/src/env-config)
  const backendRoot = path.resolve(__dirname, "../../../..")

  // Set up priorities for different env files (higher number = higher priority)
  const priorities: Record<string, number> = {}

  // Base priority: root .env files
  priorities[path.join(backendRoot, ".env")] = 10
  priorities[path.join(backendRoot, `.env.${nodeEnv}`)] = 20

  // Service-specific env files get higher priority
  if (serviceName) {
    const serviceDir = path.join(backendRoot, "api", `${serviceName}-api`)
    priorities[path.join(serviceDir, ".env")] = 30
    priorities[path.join(serviceDir, `.env.${nodeEnv}`)] = 40
  }

  // Load all env files using dotenv-mono with priorities
  // dotenv-mono automatically handles variable expansion
  try {
    load({
      path: backendRoot,
      priorities,
      expand: true, // Enable variable expansion
      override: true, // Allow overriding existing env vars
    })
  } catch (_error) {
    // Continue even if some env files don't exist
    console.debug(
      "Some env files may not exist, continuing with available files"
    )
  }

  let schema: z.ZodObject<any> = baseEnvSchema as z.ZodObject<any>

  // Add service-specific schema if provided
  if (serviceName && serviceSchemas[serviceName]) {
    schema = baseEnvSchema.merge(
      serviceSchemas[serviceName]
    ) as z.ZodObject<any>
  }

  // Add custom schema if provided
  if (customSchema) {
    schema = schema.merge(customSchema) as z.ZodObject<any>
  }

  // Parse and validate environment variables
  const result = schema.safeParse(process.env)

  if (!result.success) {
    const flat = result.error.flatten()
    console.error("Environment validation failed:", flat)
    throw new Error("Environment validation failed")
  }
  // Post-process to apply DOMAIN to API URLs if they use default values
  const env = result.data
  const domain = String(env.DOMAIN || "http://localhost")

  // Apply domain to API URLs if they're using the default localhost
  if (!process.env.EMAIL_API_URL) {
    env.EMAIL_API_URL = buildApiUrl(SERVICE_PORTS.email, "/api/email", domain)
  }
  if (!process.env.AUTH_API_URL) {
    env.AUTH_API_URL = buildApiUrl(SERVICE_PORTS.auth, "/api/auth", domain)
  }
  if (!process.env.INTL_API_URL) {
    env.INTL_API_URL = buildApiUrl(SERVICE_PORTS.intl, "/api/intl", domain)
  }
  if (!process.env.USERS_API_URL) {
    env.USERS_API_URL = buildApiUrl(SERVICE_PORTS.users, "/api/users", domain)
  }
  if (!process.env.LOCATION_API_URL) {
    env.LOCATION_API_URL = buildApiUrl(
      SERVICE_PORTS.location,
      "/api/location",
      domain
    )
  }
  if (!process.env.GENAI_API_URL) {
    env.GENAI_API_URL = buildApiUrl(SERVICE_PORTS.genai, "/api/genai", domain)
  }
  if (!process.env.FILES_API_URL) {
    env.FILES_API_URL = buildApiUrl(SERVICE_PORTS.files, "/api/files", domain)
  }
  if (!process.env.BFF_API_URL) {
    env.BFF_API_URL = buildApiUrl(SERVICE_PORTS.bff, "/api/bff", domain)
  }
  if (!process.env.COMMENTS_API_URL) {
    env.COMMENTS_API_URL = buildApiUrl(
      SERVICE_PORTS.comments,
      "/api/comments",
      domain
    )
  }
  if (!process.env.ORG_API_URL) {
    env.ORG_API_URL = buildApiUrl(SERVICE_PORTS.org, "/api/org", domain)
  }
  if (!process.env.PERMISSIONS_API_URL) {
    env.PERMISSIONS_API_URL = buildApiUrl(
      SERVICE_PORTS.permissions,
      "/api/permissions",
      domain
    )
  }
  if (!process.env.PROJECTS_API_URL) {
    env.PROJECTS_API_URL = buildApiUrl(
      SERVICE_PORTS.projects,
      "/api/projects",
      domain
    )
  }
  if (!process.env.TASKS_API_URL) {
    env.TASKS_API_URL = buildApiUrl(SERVICE_PORTS.tasks, "/api/tasks", domain)
  }
  if (!process.env.RXDB_API_URL) {
    env.RXDB_API_URL = buildApiUrl(SERVICE_PORTS.rxdb, "/api/rxdb", domain)
  }

  return env
}

export type BaseEnv = z.infer<typeof baseEnvSchema>
export type AuthEnv = BaseEnv & z.infer<typeof serviceSchemas.auth>
export type EmailEnv = BaseEnv & z.infer<typeof serviceSchemas.email>
export type GenAIEnv = BaseEnv & z.infer<typeof serviceSchemas.genai>
export type FilesEnv = BaseEnv & z.infer<typeof serviceSchemas.files>
export type LocationEnv = BaseEnv & z.infer<typeof serviceSchemas.location>
export type BffEnv = BaseEnv & z.infer<typeof serviceSchemas.bff>
export type CommentsEnv = BaseEnv & z.infer<typeof serviceSchemas.comments>
export type IntlEnv = BaseEnv & z.infer<typeof serviceSchemas.intl>
export type OrgEnv = BaseEnv & z.infer<typeof serviceSchemas.org>
export type PermissionsEnv = BaseEnv &
  z.infer<typeof serviceSchemas.permissions>
export type ProjectsEnv = BaseEnv & z.infer<typeof serviceSchemas.projects>
export type TasksEnv = BaseEnv & z.infer<typeof serviceSchemas.tasks>
export type UsersEnv = BaseEnv & z.infer<typeof serviceSchemas.users>
export type RxdbEnv = BaseEnv & z.infer<typeof serviceSchemas.rxdb>

// Export SERVICE_PORTS for external use
export { SERVICE_PORTS }
