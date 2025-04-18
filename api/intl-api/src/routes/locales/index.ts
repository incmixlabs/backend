import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

import { db } from "@/lib/db"
import {
  addLocale,
  deleteLocale,
  getAllLocales,
  getDefaultLocale,
  getLocale,
  updateLocale,
} from "@/routes/locales/openapi"
import {
  ConflictError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
const localeRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

localeRoutes.openapi(addLocale, async (c) => {
  try {
    // const user = c.get("user")
    // if (!user) throw new UnauthorizedError()

    const { code, isDefault } = c.req.valid("json")
    const existingLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", code)
      .executeTakeFirst()

    if (existingLocale) throw new ConflictError("Locale already exists")

    const insertedLocale = await db
      .insertInto("locales")
      .values({ langCode: code, isDefault })
      .returningAll()
      .executeTakeFirstOrThrow()

    if (!insertedLocale) throw new ServerError("Failed to insert Locale")

    if (isDefault) {
      await db
        .updateTable("locales")
        .set({ isDefault: false })
        .where((eb) =>
          eb.and([
            eb("id", "!=", insertedLocale.id),
            eb("isDefault", "=", true),
          ])
        )
        .execute()
    }

    return c.json({ code, isDefault }, 201)
  } catch (error) {
    return await processError<typeof addLocale>(c, error, [
      "{{ default }}",
      "add-locale",
    ])
  }
})

localeRoutes.openapi(updateLocale, async (c) => {
  try {
    const user = c.get("user")
    if (!user) throw new UnauthorizedError()
    const { code } = c.req.valid("param")
    const { code: newCode, isDefault } = c.req.valid("json")
    const existingLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", code)
      .executeTakeFirst()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    const updatedLocale = await db
      .updateTable("locales")
      .set({ langCode: newCode, isDefault })
      .where("langCode", "=", code)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (!updatedLocale) throw new ServerError("Failed to update Locale")

    if (isDefault) {
      await db
        .updateTable("locales")
        .set({ isDefault: false })
        .where((eb) =>
          eb.and([eb("id", "!=", updatedLocale.id), eb("isDefault", "=", true)])
        )
        .execute()
    }

    return c.json({ code, isDefault }, 200)
  } catch (error) {
    return await processError<typeof updateLocale>(c, error, [
      "{{ default }}",
      "update-locale",
    ])
  }
})
localeRoutes.openapi(deleteLocale, async (c) => {
  try {
    const user = c.get("user")
    if (!user) throw new UnauthorizedError()
    const { code } = c.req.valid("param")

    const existingLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", code)
      .executeTakeFirst()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    if (existingLocale.isDefault)
      throw new ConflictError("Default Locale can't be deleted")

    const deletedLocale = await db
      .deleteFrom("locales")
      .where("langCode", "=", code)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (!deletedLocale) throw new ServerError("Failed to delete Locale")

    return c.json(
      {
        code: deletedLocale.langCode,
        isDefault: Boolean(deletedLocale.langCode),
      },
      200
    )
  } catch (error) {
    return await processError<typeof deleteLocale>(c, error, [
      "{{ default }}",
      "delete-locale",
    ])
  }
})

localeRoutes.openapi(getDefaultLocale, async (c) => {
  try {
    const defaultLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("isDefault", "=", true)
      .executeTakeFirstOrThrow()

    if (!defaultLocale) throw new NotFoundError("Default Locale not set")

    return c.json(
      {
        code: defaultLocale.langCode,
        isDefault: Boolean(defaultLocale.isDefault),
      },
      200
    )
  } catch (error) {
    return await processError<typeof getDefaultLocale>(c, error, [
      "{{ default }}",
      "get-default-locale",
    ])
  }
})

localeRoutes.openapi(getLocale, async (c) => {
  try {
    const { code } = c.req.valid("param")

    const existingLocale = await db
      .selectFrom("locales")
      .selectAll()
      .where("langCode", "=", code)
      .executeTakeFirstOrThrow()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    return c.json(
      {
        code: existingLocale.langCode,
        isDefault: Boolean(existingLocale.isDefault),
      },
      200
    )
  } catch (error) {
    return await processError<typeof getLocale>(c, error, [
      "{{ default }}",
      "get-locale",
    ])
  }
})

localeRoutes.openapi(getAllLocales, async (c) => {
  try {
    const locales = await db.selectFrom("locales").selectAll().execute()

    return c.json(
      locales.map((l) => ({
        code: l.langCode,
        isDefault: Boolean(l.isDefault),
      })),
      200
    )
  } catch (error) {
    return await processError<typeof getAllLocales>(c, error, [
      "{{ default }}",
      "get-all-locales",
    ])
  }
})

export default localeRoutes
