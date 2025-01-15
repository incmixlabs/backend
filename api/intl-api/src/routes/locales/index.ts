import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

import {
  addLocale,
  deleteLocale,
  getAllLocales,
  getDefaultLocale,
  getLocale,
  updateLocale,
} from "@/routes/locales/openapi"
import type { LocaleRow } from "@/types"
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
    const user = c.get("user")
    if (!user) throw new UnauthorizedError()

    const { code, isDefault } = c.req.valid("json")
    const existingLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(code)
      .first<LocaleRow>()

    if (existingLocale) throw new ConflictError("Locale already exists")

    const insertedLocale = await c.env.DB.prepare(
      "insert into locales (lang_code, is_default) values (?, ?) returning *"
    )
      .bind(code, isDefault)
      .first<LocaleRow>()

    if (!insertedLocale) throw new ServerError("Failed to insert Locale")

    if (isDefault) {
      await c.env.DB.prepare(
        "update locales set is_default = ? where is_default = ? and id != ?"
      )
        .bind(false, true, insertedLocale.id)
        .run()
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
    const existingLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(code)
      .first<LocaleRow>()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    const updatedLocale = await c.env.DB.prepare(
      "update locales set lang_code = ?, is_default = ? where lang_code = ? returning *"
    )
      .bind(newCode, isDefault, code)
      .first<LocaleRow>()

    if (!updatedLocale) throw new ServerError("Failed to update Locale")

    if (isDefault) {
      await c.env.DB.prepare(
        "update locales set is_default = ? where is_default = ? and id != ?"
      )
        .bind(false, true, updatedLocale.id)
        .run()
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

    const existingLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(code)
      .first<LocaleRow>()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    if (existingLocale.is_default)
      throw new ConflictError("Default Locale can't be deleted")

    const deletedLocale = await c.env.DB.prepare(
      "delete from locales where lang_code = ? returning *"
    )
      .bind(code)
      .first<LocaleRow>()

    if (!deletedLocale) throw new ServerError("Failed to delete Locale")

    return c.json(
      {
        code: deletedLocale.lang_code,
        isDefault: Boolean(deletedLocale.is_default),
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
    const defaultLocale = await c.env.DB.prepare(
      "select * from locales where is_default = ?"
    )
      .bind(true)
      .first<LocaleRow>()

    if (!defaultLocale) throw new NotFoundError("Default Locale not set")

    return c.json(
      {
        code: defaultLocale.lang_code,
        isDefault: Boolean(defaultLocale.is_default),
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

    const existingLocale = await c.env.DB.prepare(
      "select * from locales where lang_code = ?"
    )
      .bind(code)
      .first<LocaleRow>()

    if (!existingLocale)
      throw new NotFoundError(`Locale '${code}' doesn't exist`)

    return c.json(
      {
        code: existingLocale.lang_code,
        isDefault: Boolean(existingLocale.is_default),
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
    const { results: locales } = await c.env.DB.prepare(
      "select * from locales"
    ).all<LocaleRow>()

    return c.json(
      locales.map((l) => ({
        code: l.lang_code,
        isDefault: Boolean(l.is_default),
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
