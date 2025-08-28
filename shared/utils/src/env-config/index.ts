import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as dotenvConfig } from "dotenv"
import { load } from "dotenv-mono"
import { z } from "zod"

// Default ports for each service

export const services = {
  auth: {
    port: 8787,
    dir: "auth",
  },
  email: {
    port: 8989,
    dir: "email",
  },
  genai: {
    port: 8383,
    dir: "genai-api",
  },
  files: {
    port: 8282,
    dir: "files-api",
  },
  location: {
    port: 9494,
    dir: "location-api",
  },
  bff: {
    port: 8080,
    dir: "bff-web",
  },
  comments: {
    port: 8585,
    dir: "comments-api",
  },
  intl: {
    port: 9090,
    dir: "intl-api",
  },
  org: {
    port: 9292,
    dir: "org-api",
  },
  permissions: {
    port: 9393,
    dir: "permissions-api",
  },
  projects: {
    port: 8484,
    dir: "projects-api",
  },
  tasks: {
    port: 8888,
    dir: "tasks-api",
  },
  users: {
    port: 9191,
    dir: "users-api",
  },
  rxdb: {
    port: 8686,
    dir: "rxdb-api",
  },
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
  DATABASE_URL: z.string().url(),
  SENTRY_DSN: z.string().url(),
  FRONTEND_URL: z.string().url(),
  DOMAIN: z.string().default("http://localhost"),
  COOKIE_NAME: z.string().default("incmix_session"),
  MOCK_DATA: z.coerce.boolean().default(false),
})

// Service-specific schema extensions
const serviceSchemas = {
  auth: baseEnvSchema.extend({
    GOOGLE_REDIRECT_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    PORT: z.coerce.number().default(services.auth.port),
    // API URLs
    EMAIL_API_URL: z.string().url().optional(),
    USERS_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  email: baseEnvSchema.extend({
    EMAIL_FROM: z.string().email(),
    RESEND_API_KEY: z.string(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    PORT: z.coerce.number().default(services.email.port),
    // API URLs
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  genai: baseEnvSchema.extend({
    FIGMA_ACCESS_TOKEN: z.string().optional(),
    FIGMA_TOKEN: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    PORT: z.coerce.number().default(services.genai.port),
    REDIS_URL: z.string().url(),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  files: baseEnvSchema.extend({
    STORAGE_TYPE: z.enum(["local", "s3"]).default("s3"),
    UPLOAD_DIR: z.string().optional(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    BUCKET_NAME: z.string().optional(),
    AWS_ENDPOINT_URL_S3: z.string(),
    PORT: z.coerce.number().default(services.files.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  location: baseEnvSchema.extend({
    LOCATION_API_KEY: z.string(),
    LOCATION_URL: z.string(),
    WEATHER_API_KEY: z.string(),
    WEATHER_URL: z.string(),
    SERP_API_KEY: z.string(),
    SERP_NEWS_URL: z.string(),
    REDIS_URL: z.string().url(),
    PORT: z.coerce.number().default(services.location.port),
    // API URLs
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema but not used in Docker Compose
  }),
  bff: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.bff.port),
    // API URLs - BFF needs access to all services
    AUTH_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    GENAI_API_URL: z.string().url().optional(),
    PROJECTS_API_URL: z.string().url().optional(),
    TASKS_API_URL: z.string().url().optional(),
    COMMENTS_API_URL: z.string().url().optional(),
    USERS_API_URL: z.string().url().optional(),
    FILES_API_URL: z.string().url().optional(),
    EMAIL_API_URL: z.string().url().optional(),
    LOCATION_API_URL: z.string().url().optional(),
    RXDB_SYNC_API_URL: z.string().url().optional(),
    PERMISSIONS_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema but not used in Docker Compose
  }),
  comments: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.comments.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  intl: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.intl.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  org: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.org.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    USERS_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  permissions: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.permissions.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    USERS_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  projects: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.projects.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  tasks: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.tasks.port),
    REDIS_URL: z.string().url(),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
    // Note: DATABASE_URL is inherited from baseEnvSchema
  }),
  users: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.users.port),
    // Note: DATABASE_URL is inherited from baseEnvSchema
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    FILES_API_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
  }),
  rxdb: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.rxdb.port),
    // API URLs
    AUTH_API_URL: z.string().url().optional(),
    INTL_API_URL: z.string().url().optional(),
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

  // Find the backend root directory
  // When compiled: dist/src/env-config -> needs 5 levels up
  // When source: src/env-config -> needs 4 levels up
  // Check if we're running from dist or src
  const isCompiled = __dirname.includes("/dist/")
  const levelsUp = isCompiled ? "../../../../.." : "../../../.."
  const backendRoot = path.resolve(__dirname, levelsUp)

  // Set up priorities for different env files (higher number = higher priority)
  const priorities: Record<string, number> = {}

  // Base priority: root .env files
  priorities[path.join(backendRoot, ".env")] = 10
  priorities[path.join(backendRoot, `.env.${nodeEnv}`)] = 20

  // Service-specific env files get higher priority
  if (serviceName) {
    const dir = services[serviceName].dir
    const serviceDir = path.join(backendRoot, "api", `${dir}`)
    priorities[path.join(serviceDir, ".env")] = 30
    priorities[path.join(serviceDir, `.env.${nodeEnv}`)] = 40
  }

  // Load all env files using dotenv with priorities
  // We'll load them in priority order (lowest to highest) so higher priority files override lower ones
  // Load all env files in priority order using regular dotenv
  // Load files from lowest to highest priority so higher priority overrides
  const sortedPaths = Object.entries(priorities)
    .sort(([, a], [, b]) => a - b)
    .map(([filePath]) => filePath)

  if (process.env.DEBUG_ENV_LOADING) {
    console.log("[DEBUG] Loading env files in order:")
    sortedPaths.forEach((p) => console.log(`  - ${p}`))
  }

  // Load each file in order
  for (const envPath of sortedPaths) {
    if (fs.existsSync(envPath)) {
      const result = dotenvConfig({
        path: envPath,
        override: true, // Allow overriding existing vars
      })
      if (process.env.DEBUG_ENV_LOADING) {
        console.log(
          `[DEBUG] Loaded ${envPath}: ${result.error ? "Failed" : "Success"}`
        )
      }
    } else if (process.env.DEBUG_ENV_LOADING) {
      console.log(`[DEBUG] File not found: ${envPath}`)
    }
  }

  if (process.env.DEBUG_ENV_LOADING) {
    console.log("[DEBUG] After loading all files:")
    console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓" : "✗")
    console.log("  SENTRY_DSN:", process.env.SENTRY_DSN ? "✓" : "✗")
    console.log(
      "  GOOGLE_REDIRECT_URL:",
      process.env.GOOGLE_REDIRECT_URL ? "✓" : "✗"
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
  // Only set defaults if the environment variable is not already provided

  env.EMAIL_API_URL = buildApiUrl(services.email.port, "/api/email", domain)
  env.AUTH_API_URL = buildApiUrl(services.auth.port, "/api/auth", domain)
  env.INTL_API_URL = buildApiUrl(services.intl.port, "/api/intl", domain)
  env.USERS_API_URL = buildApiUrl(services.users.port, "/api/users", domain)
  env.LOCATION_API_URL = buildApiUrl(
    services.location.port,
    "/api/location",
    domain
  )
  env.GENAI_API_URL = buildApiUrl(services.genai.port, "/api/genai", domain)
  env.FILES_API_URL = buildApiUrl(services.files.port, "/api/files", domain)
  env.BFF_API_URL = buildApiUrl(services.bff.port, "/api/bff", domain)
  env.COMMENTS_API_URL = buildApiUrl(
    services.comments.port,
    "/api/comments",
    domain
  )
  env.ORG_API_URL = buildApiUrl(services.org.port, "/api/org", domain)
  env.PERMISSIONS_API_URL = buildApiUrl(
    services.permissions.port,
    "/api/permissions",
    domain
  )
  env.PROJECTS_API_URL = buildApiUrl(
    services.projects.port,
    "/api/projects",
    domain
  )
  env.TASKS_API_URL = buildApiUrl(services.tasks.port, "/api/tasks", domain)
  env.RXDB_SYNC_API_URL = buildApiUrl(
    services.rxdb.port,
    "/api/rxdb-sync",
    domain
  )
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
