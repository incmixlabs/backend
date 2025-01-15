import type { HonoApp, IntlMessageRow, LocaleRow } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ConflictError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"

import {
  addMessage,
  getAllMessages,
  getDefaultMessages,
  getMessage,
  getMessagesByNamespace,
  updateMessage,
} from "@/routes/messages/openapi"

const messageRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

messageRoutes.openapi(getMessage, async (c) => {
  try {
    const { key, locale } = c.req.valid("param")

    const dbLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(locale)
      .first<LocaleRow>()

    const message = await c.env.DB.prepare(
      "select * from translations where key = ? and locale_id = ?"
    )
      .bind(key, dbLocale?.id)
      .first<IntlMessageRow>()
    if (!message)
      throw new NotFoundError(
        `Translation not found for key: '${key}' and locale: '${locale}'`
      )

    return c.json({ locale, ...message }, 200)
  } catch (error) {
    return await processError<typeof getMessage>(c, error, [
      "{{ default }}",
      "get-message",
    ])
  }
})
messageRoutes.openapi(getMessagesByNamespace, async (c) => {
  try {
    const { locale, namespace } = c.req.valid("param")

    const dbLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(locale)
      .first<LocaleRow>()

    if (!dbLocale) throw new NotFoundError(`Locale ${locale} not found`)

    const { results: messages } = await c.env.DB.prepare(
      "select * from translations where namespace = ? and locale_id = ?"
    )
      .bind(namespace, dbLocale.id)
      .all<IntlMessageRow>()

    const namespaces = messages.reduce<Record<string, string>>((res, curr) => {
      const { key, value } = curr

      res[key] = value

      return res
    }, {})

    return c.json(namespaces, 200)
  } catch (error) {
    return await processError<typeof getMessagesByNamespace>(c, error, [
      "{{ default }}",
      "get-message-by-namespace",
    ])
  }
})

messageRoutes.openapi(getDefaultMessages, async (c) => {
  try {
    const dbLocale = await c.env.DB.prepare(
      "select * from locales where is_default = ?"
    )
      .bind(true)
      .first<LocaleRow>()

    if (!dbLocale) throw new ServerError("Default Locale not set")

    const { results: messages } = await c.env.DB.prepare(
      "select * from translations where locale_id = ?"
    )
      .bind(dbLocale?.id)
      .all<IntlMessageRow>()

    return c.json(
      messages.map((m) => ({
        ...m,
        locale: dbLocale.lang_code,
      })),
      200
    )
  } catch (error) {
    return await processError<typeof getDefaultMessages>(c, error, [
      "{{ default }}",
      "get-default-messages",
    ])
  }
})

messageRoutes.openapi(getAllMessages, async (c) => {
  try {
    const { locale } = c.req.valid("param")

    const dbLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(locale)
      .first<LocaleRow>()
    if (!dbLocale) throw new NotFoundError("Locale not found")
    const { results: messages } = await c.env.DB.prepare(
      "select * from translations where locale_id = ?"
    )
      .bind(dbLocale.id)
      .all<IntlMessageRow>()

    return c.json(
      messages.map((m) => ({
        ...m,
        locale,
      })),
      200
    )
  } catch (error) {
    return await processError<typeof getAllMessages>(c, error, [
      "{{ default }}",
      "get-all-messages",
    ])
  }
})

messageRoutes.openapi(addMessage, async (c) => {
  try {
    const user = c.get("user")
    if (!user) throw new UnauthorizedError()

    const { key, locale, type, value, namespace } = c.req.valid("json")
    const dbLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(locale)
      .first<LocaleRow>()
    if (!dbLocale) throw new NotFoundError(`Locale '${locale}' not found`)
    const keyExists = await c.env.DB.prepare(
      "select * from translations where locale_id = ? and key = ?"
    )
      .bind(dbLocale.id, key)
      .first()
    if (keyExists)
      throw new ConflictError(
        `Key '${key}' already exists for locale '${locale}'`
      )

    const insertedMessage = await c.env.DB.prepare(
      "insert into translations (locale_id, key, value, type, namespace) values (?,?,?,?,?) returning *"
    )
      .bind(dbLocale.id, key, value, type, namespace)
      .first<IntlMessageRow>()
    if (!insertedMessage) throw new ServerError("Failed to add message")

    return c.json({ ...insertedMessage, locale }, 201)
  } catch (error) {
    return await processError<typeof addMessage>(c, error, [
      "{{ default }}",
      "add-message",
    ])
  }
})

messageRoutes.openapi(updateMessage, async (c) => {
  try {
    const user = c.get("user")
    if (!user) throw new UnauthorizedError()

    const { key, locale, type, value } = c.req.valid("json")
    const dbLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(locale)
      .first<LocaleRow>()
    if (!dbLocale) throw new NotFoundError(`Locale '${locale}' not found`)

    const keyExists = await c.env.DB.prepare(
      "select * from translations where locale_id = ? and key = ?"
    )
      .bind(dbLocale.id, key)
      .first()
    if (!keyExists)
      throw new NotFoundError(
        `Key '${key}' does not exist for locale '${locale}'`
      )

    const updatedMessage = await c.env.DB.prepare(
      "update translations set value = ?, type = ? where locale_id = ? and key = ? returning *"
    )
      .bind(value, type, dbLocale.id, key)
      .first<IntlMessageRow>()
    if (!updatedMessage) throw new ServerError("Failed to update message")

    return c.json({ ...updatedMessage, locale }, 200)
  } catch (error) {
    return await processError<typeof updateMessage>(c, error, [
      "{{ default }}",
      "update-message",
    ])
  }
})

export default messageRoutes
