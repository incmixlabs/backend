import type { Context } from "@/types"

export async function getDefaultLocale(c: Context) {
  const locale = await c
    .get("db")
    .selectFrom("locales")
    .selectAll()
    .where("isDefault", "=", true)
    .executeTakeFirst()

  if (!locale) return { code: "en", isDefault: true }
  return { code: locale.code, isDefault: true }
}
export async function getAllMessages(c: Context) {
  const locale = c.get("locale")
  const dbLocale = await c
    .get("db")
    .selectFrom("locales")
    .selectAll()
    .where("code", "=", locale)
    .executeTakeFirst()

  if (!dbLocale) return []

  const messages = await c
    .get("db")
    .selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}
export async function getDefaultMessages(c: Context) {
  const dbLocale = await c
    .get("db")
    .selectFrom("locales")
    .where("isDefault", "=", true)
    .selectAll()
    .executeTakeFirst()

  if (!dbLocale) return []

  const messages = await c
    .get("db")
    .selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}
