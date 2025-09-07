import type { Context } from "@/types"

export async function getDefaultLocale(request: Context) {
  const locale = await request.db
    ?.selectFrom("locales")
    .selectAll()
    .where("isDefault", "=", true)
    .executeTakeFirst()

  if (!locale) return { code: "en", isDefault: true }
  return { code: locale.code, isDefault: true }
}

export async function getAllMessages(request: Context) {
  const locale = (request as any).locale
  const dbLocale = await request.db
    ?.selectFrom("locales")
    .selectAll()
    .where("code", "=", locale)
    .executeTakeFirst()

  if (!dbLocale) return []

  const messages = await request.db
    ?.selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}

export async function getDefaultMessages(request: Context) {
  const dbLocale = await request.db
    ?.selectFrom("locales")
    .where("isDefault", "=", true)
    .selectAll()
    .executeTakeFirst()

  if (!dbLocale) return []

  const messages = await request.db
    ?.selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}
