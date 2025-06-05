import { ServerError } from "@incmix-api/utils/errors"
import type { Context } from "hono"
import type { IntlMessage, Locale } from "../types"

import type { Env as HonoEnv } from "hono"

type Env = {
  Bindings: { INTL_API_URL: string; COOKIE_NAME: string }
} & HonoEnv
export async function getDefaultLocale() {
  const res = await fetch(`${process.env["INTL_API_URL"]}/locales/default`, {
    method: "get",
  })

  const data = await res.json()

  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as Locale
}
export async function getAllMessages(c: Context<Env>) {
  const locale = c.get("locale")
  const res = await fetch(`${process.env["INTL_API_URL"]}/messages/${locale}`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
export async function getDefaultMessages() {
  const res = await fetch(`${process.env["INTL_API_URL"]}/messages/default`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
