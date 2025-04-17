import { ERROR_TEMPLATE_ALREADY_EXISTS } from "@/lib/constants"
import { db } from "@/lib/db"
import { generateTemplate } from "@/lib/services"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { Hono } from "hono"
import {
  generateStoryTemplate,
  getStoryTemplates,
  insertStoryTemplate,
} from "./openapi"
const templateRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

templateRoutes.openapi(getStoryTemplates, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const storyTemplates = await db
      .selectFrom("storyTemplates")
      .selectAll()
      .execute()
    return c.json(storyTemplates, 200)
  } catch (error) {
    return await processError<typeof getStoryTemplates>(c, error)
  }
})

templateRoutes.openapi(generateStoryTemplate, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { prompt, userTier, format } = c.req.valid("json")
    const template = await generateTemplate(c, prompt, userTier, format)
    return c.json({ template }, 200)
  } catch (error) {
    return await processError<typeof generateStoryTemplate>(c, error)
  }
})

templateRoutes.openapi(insertStoryTemplate, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { name, content } = c.req.valid("json")

    const existingTemplate = await db
      .selectFrom("storyTemplates")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst()

    if (existingTemplate) {
      const msg = await t.text(ERROR_TEMPLATE_ALREADY_EXISTS)
      throw new ConflictError(msg)
    }

    const template = await db
      .insertInto("storyTemplates")
      .values({
        name,
        content,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    return c.json(template, 201)
  } catch (error) {
    return await processError<typeof insertStoryTemplate>(c, error)
  }
})

export default templateRoutes
