import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "@incmix-api/utils"
import type { IntlMessage, Locale } from "@incmix-api/utils/types"
import { getHeaderLocale } from "@intlify/utils"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import {
  getAllMessages,
  getDefaultLocale,
  getDefaultMessages,
} from "@/lib/helper"

class I18NError extends Error {}

type I18NMiddlwareOptions = {
  localeHeaderName: string
}
const defaultOptions: I18NMiddlwareOptions = {
  localeHeaderName: "accept-language",
}

/**
 * Creates a Fastify plugin for internationalization (i18n) support.
 * This plugin sets the locale, default locale, and messages in the request based on the provided options.
 * It also adds the 'content-language' header to the response.
 *
 * @param localeHeaderName The header key to extract the locale from the request headers.
 *
 * @returns A Fastify plugin that sets the locale, default locale, and messages in the request.
 */
export function createI18nPlugin({ localeHeaderName } = defaultOptions) {
  return function i18nPlugin(fastify: FastifyInstance) {
    fastify.addHook(
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const kv = (request as any).kv

        await kv.getItem(DEFAULT_LOCALE, {
          fn: () => getDefaultLocale(request),
        })

        const localeHeader = getHeaderLocale(request.raw as any, {
          name: localeHeaderName,
        })
        const locale = localeHeader.language
        ;(request as any).locale = locale
        await kv.getItem(locale, { fn: () => getAllMessages(request) })
        await kv.getItem(DEFAULT_MESSAGES, {
          fn: () => getDefaultMessages(request),
        })

        reply.header("content-language", locale)
      }
    )
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
 * Translates a given token into a message based on the provided request.
 *
 * @param {FastifyRequest} request - The Fastify request object containing locale, defaultLocale, and messages.
 * @param {string} fallback - The fallback behavior if the translation is missing. Can be 'defaultLocale', 'token', or 'error'.
 *
 * @returns {UseTranslationReturn} An object with a 'text' function that translates a token into a message.
 *
 * @throws {I18NError} Throws an error if the plugin is not initialized or if the token is missing in translations.
 */
export async function useTranslation(
  request: FastifyRequest,
  fallback: "defaultLocale" | "key" | "error" = "key"
): Promise<UseTranslationReturn> {
  const kv = (request as any).kv
  const locale = (request as any).locale
  const defaultLocale = ((await kv.getItem(DEFAULT_LOCALE)) as Locale).code
  const messages = (await kv.getItem(locale)) as IntlMessage[]
  if (!locale || !defaultLocale || !messages)
    throw new I18NError(
      "plugin not initialized, please setup fastify with the plugin obtained with `createI18nPlugin`'"
    )
  return {
    text: async ({ key, namespace }, values) => {
      let message = messages.find(
        (m: IntlMessage) => m.key === key && m.namespace === namespace
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
          const defaultMessages = (await kv.getItem(
            DEFAULT_MESSAGES
          )) as IntlMessage[]
          const defaultMessage = defaultMessages.find(
            (dm: IntlMessage) => dm.key === key && dm.namespace === namespace
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

// Export the function with the expected name for compatibility
export const createI18nMiddleware = createI18nPlugin
