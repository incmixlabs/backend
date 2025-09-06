import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "@incmix-api/utils"
import {
  getAllMessages,
  getDefaultLocale,
  getDefaultMessages,
} from "@incmix-api/utils"

import type { IntlMessage, Locale } from "@/types"
import { getHeaderLocale } from "@intlify/utils"
import type { FastifyInstance, FastifyRequest } from "fastify"
import fp from "fastify-plugin"

declare module "fastify" {
  interface FastifyRequest {
    locale: string
  }
}

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
export function createI18nMiddleware({ localeHeaderName } = defaultOptions) {
  return fp(async (fastify: FastifyInstance) => {
    if (!fastify.hasRequestDecorator("locale")) {
      fastify.decorateRequest("locale", "")
    }

    fastify.addHook("onRequest", async (request, reply) => {
      const kv = request.kv

      await kv.getItem(DEFAULT_LOCALE, { fn: () => getDefaultLocale() })

      const localeHeader = getHeaderLocale(request.raw, {
        name: localeHeaderName,
      })
      const locale = localeHeader.language

      request.locale = locale
      await kv.getItem(locale, { fn: () => getAllMessages(request) })
      await kv.getItem(DEFAULT_MESSAGES, { fn: () => getDefaultMessages() })

      reply.header("content-language", locale)
    })
  })
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
 * @param {FastifyRequest} request - The request object containing locale, defaultLocale, and messages.
 * @param {string} fallback - The fallback behavior if the translation is missing. Can be 'defaultLocale', 'token', or 'error'.
 *
 * @returns {UseTranslationReturn} An object with a 'text' function that translates a token into a message.
 *
 * @throws {I18NError} Throws an error if the middleware is not initialized or if the token is missing in translations.
 */
export async function useTranslation(
  request: FastifyRequest,
  fallback: "defaultLocale" | "key" | "error" = "key"
): Promise<UseTranslationReturn> {
  const kv = request.kv
  const locale = request.locale
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
          (res, curr) => res.replace(`{{${curr[0]}}}`, String(curr[1])),
          message.value
        )

        message.value = updatedValue
      }

      return message.value
    },
  }
}
