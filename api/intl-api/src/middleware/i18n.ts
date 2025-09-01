import {
  getAllMessages,
  getDefaultLocale,
  getDefaultMessages,
} from "@/lib/helper"
import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "@incmix-api/utils"
import type { IntlMessage, Locale } from "@incmix-api/utils/types"
import { getHeaderLocale } from "@intlify/utils"
import type { Context, MiddlewareHandler } from "hono"

class I18NError extends Error {}

type I18NMiddlwareOptions = {
  localeHeaderName: string
}
const defaultOptions: I18NMiddlwareOptions = {
  localeHeaderName: "accept-language",
}

/**
 * Creates a middleware handler for internationalization (i18n) support.
 * This middleware sets the locale, default locale, and messages in the context based on the provided options.
 * It also adds the 'content-language' header to the response.
 *
 * @param localeHeader The header key to extract the locale from the request headers.
 *
 * @returns A middleware handler function that sets the locale, default locale, and messages in the context.
 */
export function createI18nMiddleware({
  localeHeaderName,
} = defaultOptions): MiddlewareHandler {
  return async (c, next) => {
    const kv = c.get("kv")

    await kv.getItem(DEFAULT_LOCALE, { fn: () => getDefaultLocale(c) })

    const localeHeader = getHeaderLocale(c.req.raw, { name: localeHeaderName })
    const locale = localeHeader.language
    c.set("locale", locale)
    await kv.getItem(locale, { fn: () => getAllMessages(c) })
    await kv.getItem(DEFAULT_MESSAGES, { fn: () => getDefaultMessages(c) })

    c.header("content-language", locale, { append: true })
    return await next()
  }
}

export type UseTranslationReturn = {
  text: (
    options: {
      key: string
      namespace: string
    },
    values?: Record<string, string | number | boolean>
  ) => Promise<string>
}

/**
 * Translates a given token into a message based on the provided context.
 *
 * @param {Context} context - The context object containing locale, defaultLocale, and messages.
 * @param {string} fallback - The fallback behavior if the translation is missing. Can be 'defaultLocale', 'token', or 'error'.
 *
 * @returns {UseTranslationReturn} An object with a 'text' function that translates a token into a message.
 *
 * @throws {I18NError} Throws an error if the middleware is not initialized or if the token is missing in translations.
 */
export async function useTranslation(
  context: Context,
  fallback: "defaultLocale" | "key" | "error" = "key"
): Promise<UseTranslationReturn> {
  const kv = context.get("kv")
  const locale = context.get("locale")
  const defaultLocale = (await kv.getItem<Locale>(DEFAULT_LOCALE)).code
  const messages = await kv.getItem<IntlMessage[]>(locale)
  if (!locale || !defaultLocale || !messages)
    throw new I18NError(
      "middleware not initialized, please setup `app.use` with the middleware obtained with `createI18nMiddleware`'"
    )
  return {
    text: async ({ key, namespace }, values) => {
      let message = messages.find(
        (m) => m.key === key && m.namespace === namespace
      )
      if (!message) {
        if (fallback === "error")
          throw new I18NError(
            `Key ${key} is missing in Translations for locale ${locale}`
          )
        if (fallback === "key")
          message = {
            key,
            value: key,
            type: "label",
            locale: locale,
            namespace,
          }
        else {
          const defaultMessages =
            await kv.getItem<IntlMessage[]>(DEFAULT_MESSAGES)
          const defaultMessage = defaultMessages.find(
            (dm) => dm.key === key && dm.namespace === namespace
          )

          if (!defaultMessage)
            throw new I18NError(
              `Key ${key} is missing in Translations for locale ${defaultLocale}`
            )
          message = defaultMessage
        }
      }

      if (values) {
        const updatedValue = Object.entries(values).reduce(
          (res, curr) => res.replaceAll(`{{${curr[0]}}}`, String(curr[1])),
          message.value
        )

        message.value = updatedValue
      }

      return message.value
    },
  }
}
