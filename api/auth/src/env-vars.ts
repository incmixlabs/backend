import { config } from "dotenv"
import { expand } from "dotenv-expand"
import path from "node:path"
import { z } from "zod"

expand(
  config({
    path: path.resolve(
      process.cwd(),
      process.env["NODE_ENV"] === "test" ? ".env.test" : ".env"
    ),
  })
)

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  FRONTEND_URL: z.string().url(),
  EMAIL_URL: z.string().url(),
  INTL_URL: z.string().url(),
  USERS_API_URL: z.string().url(),
  COOKIE_NAME: z.string().default("incmix_session"),
  GOOGLE_REDIRECT_URL: z.string().url(),
  DOMAIN: z.string().default("localhost"),
})

export type env = z.infer<typeof EnvSchema>

const { data: env, error } = EnvSchema.safeParse(process.env)

if (error) {
  console.error("❌ Invalid env:")
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
  process.exit(1)
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const envVars = env!
