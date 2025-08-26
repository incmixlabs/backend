import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { z } from "zod"

// Default ports for each service
const SERVICE_PORTS = {
  auth: 8787,
  email: 8989,
  genai: 8383,
  files: 8282,
  location: 9494,
  bff: 8080,
  comments: 8585,
  intl: 9090,
  org: 9292,
  permissions: 9393,
  projects: 8484,
  tasks: 8888,
  users: 9191,
  rxdb: 8686,
} as const
const dirs: { [K in keyof typeof SERVICE_PORTS]: string } = {
  auth: "auth",
  email: "email",
  genai: "genai-api",
  files: "files-api",
  location: "location-api",
  bff: "bff-web",
  comments: "comments-api",
  intl: "intl-api",
  org: "org-api",
  permissions: "permissions-api",
  projects: "projects-api",
  tasks: "tasks-api",
  users: "users-api",
  rxdb: "rxdb-api",
}
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
  SENTRY_DSN: z.url().optional(),
  FRONTEND_URL: z.url().optional(),
  API_URL: z.url().optional(),
  DOMAIN: z.string().default("http://localhost"),
  COOKIE_NAME: z.string().default("incmix_session"),
  MOCK_ENV: z.coerce.boolean().default(false),
})

// Service-specific schema extensions
const serviceSchemas = {
  auth: baseEnvSchema.extend({
    GOOGLE_REDIRECT_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    PORT: z.coerce.number().default(SERVICE_PORTS.auth),
    // API URLs
    EMAIL_API_URL: z.url(),
    USERS_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  email: baseEnvSchema.extend({
    EMAIL_FROM: z.email(),
    RESEND_API_KEY: z.string(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.email),
    // API URLs
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  genai: baseEnvSchema.extend({
    FIGMA_ACCESS_TOKEN: z.string().optional(),
    FIGMA_TOKEN: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    PORT: z.coerce.number().default(SERVICE_PORTS.genai),
    REDIS_URL: z.url(),
    // API URLs
    AUTH_API_URL: z.url(),
    ORG_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  files: baseEnvSchema.extend({
    STORAGE_TYPE: z.enum(["local", "s3"]).default("s3"),
    UPLOAD_DIR: z.string().optional(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET: z.string(),
    BUCKET_NAME: z.string().optional(),
    AWS_ENDPOINT_URL_S3: z.string(),
    PORT: z.coerce.number().default(SERVICE_PORTS.files),
    // API URLs
    AUTH_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  location: baseEnvSchema
    .omit({
      DATABASE_URL: true,
    })
    .extend({
      LOCATION_API_KEY: z.string(),
      LOCATION_URL: z.string(),
      WEATHER_API_KEY: z.string(),
      WEATHER_URL: z.string(),
      SERP_API_KEY: z.string(),
      SERP_NEWS_URL: z.string(),
      REDIS_URL: z.url(),
      PORT: z.coerce.number().default(SERVICE_PORTS.location),
      // API URLs
      INTL_API_URL: z.url(),
      // Note: DATABASE_URL is inherited from baseEnvSchema but not used in Docker Compose
    }),
  bff: baseEnvSchema
    .omit({
      DATABASE_URL: true,
    })
    .extend({
      PORT: z.coerce.number().default(SERVICE_PORTS.bff),
      // API URLs - BFF needs access to all services
      AUTH_API_URL: z.url(),
      ORG_API_URL: z.url(),
      INTL_API_URL: z.url(),
      GENAI_API_URL: z.url(),
      PROJECTS_API_URL: z.url(),
      TASKS_API_URL: z.url(),
      COMMENTS_API_URL: z.url(),
      USERS_API_URL: z.url(),
      FILES_API_URL: z.url(),
      EMAIL_API_URL: z.url(),
      LOCATION_API_URL: z.url(),
      RXDB_SYNC_API_URL: z.url(),
      PERMISSIONS_API_URL: z.url(),
      // Note: DATABASE_URL is inherited from baseEnvSchema but not used in Docker Compose
    }),
  comments: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.comments),
    // API URLs
    AUTH_API_URL: z.url(),
    ORG_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  intl: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.intl),
    // API URLs
    AUTH_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  org: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.org),
    // API URLs
    AUTH_API_URL: z.url(),
    USERS_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  permissions: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.permissions),
    // API URLs
    AUTH_API_URL: z.url(),
    USERS_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  projects: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.projects),
    // API URLs
    AUTH_API_URL: z.url(),
    ORG_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  tasks: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.tasks),
    REDIS_URL: z.url(),
    // API URLs
    AUTH_API_URL: z.url(),
    ORG_API_URL: z.url(),
    INTL_API_URL: z.url(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  users: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.users),
    // Note: DATABASE_URL is inherited from baseEnvSchema
    // API URLs
    AUTH_API_URL: z.url(),
    FILES_API_URL: z.url(),
    ORG_API_URL: z.url(),
    INTL_API_URL: z.url(),
  }),
  rxdb: baseEnvSchema.extend({
    PORT: z.coerce.number().default(SERVICE_PORTS.rxdb),
    // API URLs
    AUTH_API_URL: z.url(),
    INTL_API_URL: z.url(),
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

  // Find the backend root directory more reliably
  // Start from the current directory and look for the backend root
  let backendRoot = __dirname
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    // Check if we're in the backend root by looking for characteristic files/directories
    if (
      fs.existsSync(path.join(backendRoot, "docker-compose.yml")) ||
      fs.existsSync(path.join(backendRoot, "api")) ||
      fs.existsSync(path.join(backendRoot, "shared"))
    ) {
      break
    }

    const parent = path.dirname(backendRoot)
    if (parent === backendRoot) {
      // We've reached the filesystem root, fall back to a reasonable default
      backendRoot = process.cwd()
      break
    }

    backendRoot = parent
    attempts++
  }

  // Set up priorities for different env files (higher number = higher priority)
  const priorities: Record<string, number> = {}

  // Base priority: root .env files
  priorities[path.join(backendRoot, ".env")] = 10
  priorities[path.join(backendRoot, `.env.${nodeEnv}`)] = 20

  // Service-specific env files get higher priority
  if (serviceName) {
    const dir = dirs[serviceName]
    const serviceDir = path.join(backendRoot, "api", `${dir}`)
    priorities[path.join(serviceDir, ".env")] = 30
    priorities[path.join(serviceDir, `.env.${nodeEnv}`)] = 40
  }

  // Load all env files using dotenv with priorities
  // We'll load them in priority order (lowest to highest) so higher priority files override lower ones
  const sortedFiles = Object.entries(priorities)
    .sort(([, a], [, b]) => a - b)
    .map(([filePath]) => filePath)

  for (const filePath of sortedFiles) {
    if (fs.existsSync(filePath)) {
      try {
        config({
          path: filePath,
          override: true, // Allow overriding existing env vars
        })
      } catch (_error) {
        // Continue even if some env files don't exist
        console.debug(
          "Some env files may not exist, continuing with available files"
        )
      }
    }
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
  // Only set defaults if the environment variable is not already provided

  if (!env.EMAIL_API_URL) {
    env.EMAIL_API_URL = buildApiUrl(SERVICE_PORTS.email, "/api/email", domain)
  }
  if (!env.AUTH_API_URL) {
    env.AUTH_API_URL = buildApiUrl(SERVICE_PORTS.auth, "/api/auth", domain)
  }
  if (!env.INTL_API_URL) {
    env.INTL_API_URL = buildApiUrl(SERVICE_PORTS.intl, "/api/intl", domain)
  }
  if (!env.USERS_API_URL) {
    env.USERS_API_URL = buildApiUrl(SERVICE_PORTS.users, "/api/users", domain)
  }
  if (!env.LOCATION_API_URL) {
    env.LOCATION_API_URL = buildApiUrl(
      SERVICE_PORTS.location,
      "/api/location",
      domain
    )
  }
  if (!env.GENAI_API_URL) {
    env.GENAI_API_URL = buildApiUrl(SERVICE_PORTS.genai, "/api/genai", domain)
  }
  if (!env.FILES_API_URL) {
    env.FILES_API_URL = buildApiUrl(SERVICE_PORTS.files, "/api/files", domain)
  }
  if (!env.BFF_API_URL) {
    env.BFF_API_URL = buildApiUrl(SERVICE_PORTS.bff, "/api/bff", domain)
  }
  if (!env.COMMENTS_API_URL) {
    env.COMMENTS_API_URL = buildApiUrl(
      SERVICE_PORTS.comments,
      "/api/comments",
      domain
    )
  }
  if (!env.ORG_API_URL) {
    env.ORG_API_URL = buildApiUrl(SERVICE_PORTS.org, "/api/org", domain)
  }
  if (!env.PERMISSIONS_API_URL) {
    env.PERMISSIONS_API_URL = buildApiUrl(
      SERVICE_PORTS.permissions,
      "/api/permissions",
      domain
    )
  }
  if (!env.PROJECTS_API_URL) {
    env.PROJECTS_API_URL = buildApiUrl(
      SERVICE_PORTS.projects,
      "/api/projects",
      domain
    )
  }
  if (!env.TASKS_API_URL) {
    env.TASKS_API_URL = buildApiUrl(SERVICE_PORTS.tasks, "/api/tasks", domain)
  }

  if (!env.RXDB_SYNC_API_URL) {
    env.RXDB_SYNC_API_URL = buildApiUrl(
      SERVICE_PORTS.rxdb,
      "/api/rxdb-sync",
      domain
    )
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
