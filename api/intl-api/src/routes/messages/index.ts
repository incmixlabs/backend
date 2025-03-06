import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ConflictError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"

import { type Database, type MessageColumn, columns } from "@/db-schema"
import { db } from "@/lib/db"
import {
  addMessage,
  deleteMessages,
  getAllMessages,
  getAllMessagesByLocale,
  getDefaultMessages,
  getMessage,
  getMessagesByNamespace,
  updateMessage,
} from "@/routes/messages/openapi"
import { createKyselyFilter, parseQueryParams } from "@incmix-api/utils"
import type { ExpressionWrapper, OrderByExpression, SqlBool } from "kysely"

const messageRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

messageRoutes.openapi(getMessage, async (c) => {
  try {
    const { key, locale } = c.req.valid("param")

    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", locale)
      .executeTakeFirstOrThrow()

    const message = await db
      .selectFrom("translations")
      .selectAll()
      .where("key", "=", key)
      .where("localeId", "=", dbLocale.id)
      .executeTakeFirstOrThrow()

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
messageRoutes.openapi(deleteMessages, async (c) => {
  try {
    const { items } = c.req.valid("json")

    await Promise.all(
      items.map((item) =>
        db
          .deleteFrom("translations")
          .where((eb) => {
            return eb.and([
              eb("key", "=", item.key),
              eb(
                "localeId",
                "=",
                eb
                  .selectFrom("locales")
                  .select("id")
                  .where("langCode", "=", item.locale)
              ),
            ])
          })
          .executeTakeFirst()
      )
    )

    return c.json({ message: "Translation Deleted Successfully" }, 200)
  } catch (error) {
    return await processError<typeof deleteMessages>(c, error, [
      "{{ default }}",
      "delete-message",
    ])
  }
})
messageRoutes.openapi(getMessagesByNamespace, async (c) => {
  try {
    const { locale, namespace } = c.req.valid("param")

    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", locale)
      .executeTakeFirstOrThrow()

    if (!dbLocale) throw new NotFoundError(`Locale ${locale} not found`)

    const messages = await db
      .selectFrom("translations")
      .selectAll()
      .where("namespace", "=", namespace)
      .where("localeId", "=", dbLocale.id)
      .execute()

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
    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("isDefault", "=", true)
      .executeTakeFirstOrThrow()

    if (!dbLocale) throw new ServerError("Default Locale not set")

    const messages = await db
      .selectFrom("translations")
      .selectAll()
      .where("localeId", "=", dbLocale.id)
      .execute()

    return c.json(
      messages.map((m) => ({
        ...m,
        locale: dbLocale.langCode,
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

messageRoutes.openapi(getAllMessagesByLocale, async (c) => {
  try {
    const { locale } = c.req.valid("param")

    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", locale)
      .executeTakeFirstOrThrow()

    if (!dbLocale) throw new NotFoundError("Locale not found")

    const messages = await db
      .selectFrom("translations")
      .selectAll()
      .where("localeId", "=", dbLocale.id)
      .execute()

    return c.json(
      messages.map((m) => ({
        ...m,
        locale,
      })),
      200
    )
  } catch (error) {
    return await processError<typeof getAllMessagesByLocale>(c, error, [
      "{{ default }}",
      "get-all-messages-by-locale",
    ])
  }
})

messageRoutes.openapi(getAllMessages, async (c) => {
  try {
    const queryParams = c.req.query()

    const { filters, sort, pagination, joinOperator } =
      parseQueryParams<MessageColumn>(queryParams, columns)

    let query = db
      .selectFrom("translations")
      .innerJoin("locales", "locales.id", "translations.localeId")
      .select([
        "translations.id",
        "translations.key",
        "translations.value",
        "translations.type",
        "translations.namespace",
        "locales.langCode as locale",
      ])

    if (filters.length) {
      query = query.where(({ eb, and, or }) => {
        const expressions: ExpressionWrapper<
          Database,
          "translations",
          string | SqlBool | null | number
        >[] = []

        for (const filter of filters) {
          const kf = createKyselyFilter<
            MessageColumn,
            Database,
            "translations"
          >(filter, eb)
          if (kf) expressions.push(kf)
        }
        // @ts-expect-error Type issue, fix WIP
        if (joinOperator === "or") return or(expressions)
        // @ts-expect-error Type issue, fix WIP
        return and(expressions)
      })
    }

    if (sort.length) {
      query = query.orderBy(
        sort.map((s) => {
          let field = s.id
          if (field === "locale") field = "localeId"
          const order = s.desc ? "desc" : "asc"
          const expression: OrderByExpression<
            Database,
            "translations",
            typeof order
          > = `${field} ${order}`

          return expression
        })
      )
    }

    const total = await query
      .select(({ fn }) => fn.count<number>("translations.id").as("count"))
      .executeTakeFirst()

    if (pagination) {
      query = query.limit(pagination.pageSize)
      if (pagination.page && pagination.page > 1) {
        query = query.offset((pagination.page - 1) * pagination.pageSize)
      }
    }

    const messages = await query.execute()
    const totalPages = Math.ceil(
      (total?.count ?? 1) / (pagination?.pageSize ?? 10)
    )

    const hasNextPage = totalPages > (pagination?.page ?? 1)
    const hasPrevPage = (pagination?.page ?? 1) > 1
    return c.json(
      {
        results: messages,
        metadata: {
          page: pagination?.page ?? 1,
          pageSize: pagination?.pageSize ?? 10,
          total: total?.count ?? 0,
          pageCount: totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
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
    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", locale)
      .executeTakeFirstOrThrow()

    if (!dbLocale) throw new NotFoundError(`Locale '${locale}' not found`)

    const keyExists = await db
      .selectFrom("translations")
      .selectAll()
      .where("localeId", "=", dbLocale.id)
      .where("key", "=", key)
      .executeTakeFirstOrThrow()

    if (keyExists)
      throw new ConflictError(
        `Key '${key}' already exists for locale '${locale}'`
      )

    const insertedMessage = await db
      .insertInto("translations")
      .values({ localeId: dbLocale.id, key, value, type, namespace })
      .returningAll()
      .executeTakeFirstOrThrow()

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
    const dbLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", locale)
      .executeTakeFirstOrThrow()

    if (!dbLocale) throw new NotFoundError(`Locale '${locale}' not found`)

    const keyExists = await db
      .selectFrom("translations")
      .selectAll()
      .where("localeId", "=", dbLocale.id)
      .where("key", "=", key)
      .executeTakeFirstOrThrow()

    if (!keyExists)
      throw new NotFoundError(
        `Key '${key}' does not exist for locale '${locale}'`
      )

    const updatedMessage = await db
      .updateTable("translations")
      .set({ value, type })
      .where("localeId", "=", dbLocale.id)
      .where("key", "=", key)
      .returningAll()
      .executeTakeFirstOrThrow()

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
