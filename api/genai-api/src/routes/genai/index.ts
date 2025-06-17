import { ERROR_TEMPLATE_NOT_FOUND } from "@/lib/constants"

import { FigmaService } from "@/lib/figma"

import {
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
} from "@/lib/services"
import {
  generateCodeFromFigma,
  generateFromFigma,
  generateUserStory,
} from "@/routes/genai/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { streamSSE } from "hono/streaming"
const genaiRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

genaiRoutes.openapi(generateUserStory, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { prompt, userTier, templateId } = c.req.valid("json")

    // const template = await c
    //   .get("db")
    //   .selectFrom("storyTemplates")
    //   .selectAll()
    //   .where("id", "=", templateId)
    //   .executeTakeFirst()

    // if (!template) {
    //   const msg = await t.text(ERROR_TEMPLATE_NOT_FOUND)
    //   throw new UnprocessableEntityError(msg)
    // }

    const userStory = await aiGenerateUserStory(
      c,
      prompt,
      {
        id: 1,
        name: "Test Template",
        content: "Test Content",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "test",
      },
      userTier
    )
    return c.json({ userStory }, 200)
  } catch (error) {
    return await processError<typeof generateUserStory>(c, error, [
      "{{ default }}",
      "generate-user-story",
    ])
  }
})

genaiRoutes.openapi(generateFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { url, prompt, userTier } = c.req.valid("json")
    const figmaService = new FigmaService()
    const figmaImage = await figmaService.getFigmaImage(url)

    const userStory = await generateUserStoryFromImage(
      figmaImage,
      prompt,
      userTier
    )

    return c.json({ userStory, imageUrl: figmaImage }, 200)
  } catch (error) {
    return await processError<typeof generateFromFigma>(c, error, [
      "{{ default }}",
      "genrate-from-figma",
    ])
  }
})

genaiRoutes.openapi(generateCodeFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { url, userTier } = c.req.valid("json")
    const figmaService = new FigmaService()

    return streamSSE(
      c,
      await figmaService.generateReactFromFigma(url, userTier)
    )
  } catch (error) {
    return await processError<typeof generateCodeFromFigma>(c, error, [
      "{{ default }}",
      "generate-code-from-figma",
    ])
  }
})

export default genaiRoutes
