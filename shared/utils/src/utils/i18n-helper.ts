import { createEnvConfig } from "@incmix-api/utils/env-config"
import { ServerError } from "@incmix-api/utils/errors"
import type { Context } from "hono"
import type { IntlMessage, Locale } from "../types"

// Use the new env-config system with dotenv-mono
// This will automatically merge:
// 1. Root .env file
// 2. Root .env.{NODE_ENV} file
// 3. Service-specific .env file (if exists)
// 4. Service-specific .env.{NODE_ENV} file (if exists)
let envVars: any = null

function getEnvVars() {
  if (!envVars) {
    envVars = createEnvConfig("intl")
  }
  return envVars
}

type Env = {
  Bindings: { INTL_API_URL: string; COOKIE_NAME: string }
}
export async function getDefaultLocale() {
  const vars = getEnvVars()
  const res = await fetch(`${vars["INTL_API_URL"]}/locales/default`, {
    method: "get",
  })

  const data = await res.json()

  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as Locale
}
export async function getAllMessages(c: Context<Env>) {
  const locale = c.get("locale")
  const vars = getEnvVars()
  const res = await fetch(`${vars["INTL_API_URL"]}/messages/${locale}`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
export async function getDefaultMessages() {
  const vars = getEnvVars()
  const res = await fetch(`${vars["INTL_API_URL"]}/messages/default`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
