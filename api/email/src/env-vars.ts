import path from "node:path"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
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
  INTL_URL: z.string().url(),
  COOKIE_NAME: z.string().default("incmix_session"),
  DOMAIN: z.string().default("localhost"),
  SENDGRID_API_KEY: z.string(),
  SENDGRID_WEBHOOK_KEY: z.string(),
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
