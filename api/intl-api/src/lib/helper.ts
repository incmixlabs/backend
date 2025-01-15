import type { Context, IntlMessageRow, LocaleRow } from "@/types"
import { ServerError } from "@incmix-api/utils/errors"
import type { IntlMessage, Locale } from "@incmix-api/utils/types"

export async function getDefaultLocale(c: Context) {
  const locale = await c.env.DB.prepare(
    "select * from locales where is_default = ?"
  )
    .bind(1)
    .first<LocaleRow>()

  if (!locale) throw new ServerError("Defaulty locale not set")
  return { code: locale.lang_code, isDefault: true } as Locale
}
export async function getAllMessages(c: Context) {
  const locale = c.get("locale")
  const dbLocale = await c.env.DB.prepare(
    "select * from locales where lang_code = ?"
  )
    .bind(locale)
    .first<LocaleRow>()
  const { results: messages } = await c.env.DB.prepare(
    "select * from translations where locale_id = ?"
  )
    .bind(dbLocale?.id)
    .all<IntlMessageRow>()

  return messages.map<IntlMessage>((m) => ({
    key: m.key,
    locale,
    type: m.type,
    value: m.value,
    namespace: m.namespace,
  }))
}
export async function getDefaultMessages(c: Context) {
  const dbLocale = await c.env.DB.prepare(
    "select * from locales where is_default = ?"
  )
    .bind(true)
    .first<LocaleRow>()
  if (!dbLocale) throw new ServerError("Default Locale not set")

  const { results: messages } = await c.env.DB.prepare(
    "select * from translations where locale_id = ?"
  )
    .bind(dbLocale.id)
    .all<IntlMessageRow>()

  return messages.map<IntlMessage>((m) => ({
    key: m.key,
    locale: dbLocale?.lang_code,
    type: m.type,
    value: m.value,
    namespace: m.namespace,
  }))
}
