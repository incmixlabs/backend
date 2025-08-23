import path from "node:path"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
import { z } from "zod"

// Load environment variables from .env file
const dotenvResult = config({
  path: path.resolve(process.cwd(), ".env"),
})
expand(dotenvResult)

export function getEnvSchema(port: number) {
  // Define the schema for environment variables
  const EnvSchema = z.object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(port),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    FRONTEND_URL: z.string().url(),
    EMAIL_API_URL: z.string().url(),
    INTL_API_URL: z.string().url(),
    USERS_API_URL: z.string().url(),
    COOKIE_NAME: z.string().default("incmix_session"),
    GOOGLE_REDIRECT_URL: z.string().url(),
    DOMAIN: z.string().default("localhost"),
    MOCK_ENV: z.string().default("false"),
    LOCATION_API_URL: z.string().url(),
  })

  const { data: env, error } = EnvSchema.safeParse(process.env)
  if (error || !env) {
    console.error("❌ Invalid env:")
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
    process.exit(1)
  } else {
    env.PORT = port
  }
  return { env }
}
