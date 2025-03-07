import type { Context } from "@/types"
import { ServerError } from "@incmix-api/utils/errors"
import type { Locale } from "@incmix-api/utils/types"
import { db } from "./db"

export async function getDefaultLocale() {
  const locale = await db
    .selectFrom("locales")
    .selectAll()
    .where("isDefault", "=", true)
    .executeTakeFirst()

  if (!locale) throw new ServerError("Defaulty locale not set")
  return { code: locale.langCode, isDefault: true } as Locale
}
export async function getAllMessages(c: Context) {
  const locale = c.get("locale")
  const dbLocale = await db
    .selectFrom("locales")
    .selectAll()
    .where("langCode", "=", locale)
    .executeTakeFirst()

  if (!dbLocale) throw new ServerError("Locale not found")

  const messages = await db
    .selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}
export async function getDefaultMessages() {
  const dbLocale = await db
    .selectFrom("locales")
    .where("isDefault", "=", true)
    .selectAll()
    .executeTakeFirst()

  if (!dbLocale) throw new ServerError("Default Locale not set")

  const messages = await db
    .selectFrom("translations")
    .selectAll()
    .where("localeId", "=", dbLocale.id)
    .execute()

  return messages
}
