import { ServerError } from "@incmix-api/utils/errors"
import type { IntlMessage, Locale } from "@incmix/shared/types"
import type { Context } from "hono"

export async function getDefaultLocale(c: Context) {
  const res = await c.env.INTL.fetch(`${c.env.INTL_URL}/locales/default`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as Locale
}
export async function getAllMessages(c: Context) {
  const locale = c.get("locale")
  const res = await c.env.INTL.fetch(`${c.env.INTL_URL}/messages/${locale}`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
export async function getDefaultMessages(c: Context) {
  const res = await c.env.INTL.fetch(`${c.env.INTL_URL}/messages/default`, {
    method: "get",
  })

  const data = await res.json()
  if (!res.ok) throw new ServerError((data as { message: string }).message)
  return data as IntlMessage[]
}
