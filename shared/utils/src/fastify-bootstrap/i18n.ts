// TODO - strongly typed
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyInstance, FastifyRequest as FReq } from "fastify"
import fp from "fastify-plugin"
import type { Env } from "../env-config"
import type { IntlMessage, Locale, User } from "../types"
import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "../utils/constants"
import {
  getAllMessages,
  getDefaultLocale,
  getDefaultMessages,
} from "../utils/i18n-helper"

type FastifyRequest = FReq & {
  user?: User
  db: KyselyDb
  redis?: any
  requestId?: string
  locale?: string // This is now set by the translation plugin
  i18n?: any
  kvStore?: any
  env: Env
  raw?: any
}

// Translation context for Fastify - matches the Hono UseTranslationReturn exactly
export interface FastifyTranslationContext {
  text: (
    options: {
      key: string
      namespace: string
    },
    values?: Record<string, string | number | boolean>
  ) => Promise<string>
}

// I18N Error class
class I18NError extends Error {}

// Translation plugin options
interface TranslationPluginOptions {
  localeHeaderName?: string
  fallback?: "defaultLocale" | "key" | "error"
}

const defaultOptions: TranslationPluginOptions = {
  localeHeaderName: "accept-language",
  fallback: "key",
}

// Mock Hono context for compatibility with existing i18n helpers
interface MockHonoContext {
  get(key: string): any
  req: {
    raw: Request
  }
}

// Create a mock Hono context from FastifyRequest
function createMockHonoContext(request: FastifyRequest): MockHonoContext {
  return {
    get(key: string) {
      switch (key) {
        case "locale":
          return request.locale
        case "kv":
          return request.kvStore
        case "user":
          return request.user
        default:
          return undefined
      }
    },
    req: {
      raw: request.raw,
    },
  }
}

// Fastify translation function that exactly matches the Hono useTranslation behavior
export async function useFastifyTranslation(
  request: FastifyRequest,
  fallback: "defaultLocale" | "key" | "error" = "key"
): Promise<FastifyTranslationContext> {
  const kv = request.kvStore
  const locale = request.locale

  if (!kv || !locale) {
    // If kvStore or locale are not available, return fallback translation
    return createFallbackTranslationContext(fallback)
  }

  try {
    const defaultLocale = ((await kv.getItem(DEFAULT_LOCALE)) as Locale)?.code
    const messages = (await kv.getItem(locale)) as IntlMessage[]

    if (!locale || !defaultLocale || !messages) {
      throw new I18NError(
        "middleware not initialized, please setup the translation plugin properly"
      )
    }

    return {
      text: async ({ key, namespace }, values) => {
        let message = messages.find(
          (m) => m.key === key && m.namespace === namespace
        )

        if (!message) {
          if (fallback === "error") {
            throw new I18NError(
              `Key ${key} is missing in Translations for locale ${locale}`
            )
          }

          if (fallback === "key") {
            message = {
              key,
              value: key,
              type: "label" as const,
              locale: locale,
              namespace,
            }
          } else {
            // fallback === "defaultLocale"
            const defaultMessages = (await kv.getItem(
              DEFAULT_MESSAGES
            )) as IntlMessage[]
            const defaultMessage = defaultMessages?.find(
              (dm) => dm.key === key && dm.namespace === namespace
            )

            if (!defaultMessage) {
              throw new I18NError(
                `Key ${key} is missing in Translations for locale ${defaultLocale}`
              )
            }
            message = defaultMessage
          }
        }

        if (values && message) {
          const updatedValue = Object.entries(values).reduce(
            (res, curr) => res.replace(`{{${curr[0]}}}`, String(curr[1])),
            message.value
          )
          message.value = updatedValue
        }

        return message?.value || key
      },
    }
  } catch (error) {
    console.warn("Translation initialization failed, using fallbacks:", error)
    return createFallbackTranslationContext(
      fallback
    ) as FastifyTranslationContext
  }
}

// Create fallback translation context for when translation system is not available
function createFallbackTranslationContext(
  fallback: "defaultLocale" | "key" | "error"
): any {
  return {
    text: ({ key, namespace }: any) => {
      if (fallback === "error") {
        throw new I18NError(`Translation not available: ${namespace}.${key}`)
      }

      // For both "key" and "defaultLocale" fallback, return the key
      // This matches the behavior when translation fails in the original implementation
      return key
    },
  }
}

// Initialize translation context for a request (matches Hono middleware behavior)
async function initializeTranslationForRequest(
  request: FastifyRequest,
  options: TranslationPluginOptions
) {
  const { localeHeaderName = "accept-language" } = options

  try {
    // Ensure kvStore is available
    if (!request.kvStore) {
      console.warn(
        "kvStore not available on request, translation will use fallbacks"
      )
      request.locale = "en"
      return
    }

    const kv = request.kvStore

    // Load default locale (matches Hono middleware)
    await kv.getItem(DEFAULT_LOCALE, { fn: () => getDefaultLocale() })

    // Get locale from header (matches Hono middleware)
    const acceptLanguage =
      request.headers[localeHeaderName] || request.headers["accept-language"]
    const locale =
      typeof acceptLanguage === "string"
        ? acceptLanguage.split(",")[0].split("-")[0].toLowerCase()
        : "en"

    // Set locale on request
    request.locale = locale

    // Load messages for current locale (matches Hono middleware)
    const mockContext = createMockHonoContext(request)
    await kv.getItem(locale, { fn: () => getAllMessages(mockContext as any) })
    await kv.getItem(DEFAULT_MESSAGES, { fn: () => getDefaultMessages() })
  } catch (error) {
    console.warn("Failed to initialize translation context:", error)
    request.locale = request.locale || "en"
  }
}

// Fastify plugin to add translation support
export function translationPlugin(
  fastify: FastifyInstance,
  options: TranslationPluginOptions = {}
) {
  const pluginOptions = { ...defaultOptions, ...options }

  // Decorate request with locale property
  fastify.decorateRequest("locale", undefined)

  // Add preHandler hook to initialize translation for each request
  fastify.addHook("preHandler", async (request, reply) => {
    // @ts-expect-error
    await initializeTranslationForRequest(request, pluginOptions)

    // Set content-language header (matches Hono middleware)
    // @ts-expect-error
    if (request.locale) {
      // @ts-expect-error
      reply.header("content-language", request.locale)
    }
  })
}

// Export as Fastify plugin
export default fp(translationPlugin, {
  name: "fastify-translation-plugin",
  fastify: "4.x",
})

// Also export the standalone function for direct use
