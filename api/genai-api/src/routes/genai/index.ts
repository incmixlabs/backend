import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  processError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { streamSSE } from "hono/streaming"
import { FigmaService } from "@/lib/figma"
import {
  generateMultipleUserStories as aiGenerateMultipleUserStories,
  generateProject as aiGenerateProject,
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
} from "@/lib/services"
import {
  generateCodeFromFigma,
  generateMultipleUserStories,
  generateProject,
  generateUserStory,
  generateUserStoryFromFigma,
  getFigmaImage,
} from "@/routes/genai/openapi"
import type { HonoApp } from "@/types"

const genaiRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

genaiRoutes.openapi(generateProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { prompt, userTier, templateId } = c.req.valid("json")

    const template = await c
      .get("db")
      .selectFrom("storyTemplates")
      .selectAll()
      .where("id", "=", templateId)
      .executeTakeFirst()

    return streamSSE(c, async (stream) => {
      const result = aiGenerateProject(c, prompt, template, userTier)
      for await (const chunk of result.partialObjectStream) {
        stream.writeSSE({
          data: JSON.stringify(chunk),
        })
      }
      stream.close()
    })
  } catch (error) {
    return await processError<typeof generateUserStory>(c, error, [
      "{{ default }}",
      "generate-user-story",
    ])
  }
})
genaiRoutes.openapi(generateUserStory, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { prompt, userTier, templateId } = c.req.valid("json")

    const template = await c
      .get("db")
      .selectFrom("storyTemplates")
      .selectAll()
      .where("id", "=", templateId)
      .executeTakeFirst()

    return streamSSE(c, async (stream) => {
      const result = aiGenerateUserStory(prompt, template, userTier)
      for await (const chunk of result.partialObjectStream) {
        stream.writeSSE({
          data: JSON.stringify(chunk),
        })
      }
      stream.close()
    })
  } catch (error) {
    return await processError<typeof generateUserStory>(c, error, [
      "{{ default }}",
      "generate-user-story",
    ])
  }
})

genaiRoutes.openapi(generateUserStoryFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { url, prompt, userTier, templateId } = c.req.valid("json")
    const figmaService = new FigmaService()
    const figmaImage = await figmaService.getFigmaImage(url)

    const template = await c
      .get("db")
      .selectFrom("storyTemplates")
      .selectAll()
      .where("id", "=", templateId)
      .executeTakeFirst()

    const userStory = await generateUserStoryFromImage(
      figmaImage,
      prompt,
      userTier,
      template
    )

    return c.json({ ...userStory, imageUrl: figmaImage }, 200)
  } catch (error) {
    return await processError<typeof generateUserStoryFromFigma>(c, error, [
      "{{ default }}",
      "generate-user-story-from-figma",
    ])
  }
})

genaiRoutes.openapi(generateCodeFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const {
      url,
      userTier,
      framework,
      styling,
      typescript,
      responsive,
      accessibility,
      componentLibrary,
    } = c.req.valid("json")

    const figmaService = new FigmaService()

    // Create code generation options
    const options = {
      framework,
      styling,
      typescript,
      responsive,
      accessibility,
      componentLibrary,
    }

    const result = await figmaService.generateReactFromFigma(
      url,
      userTier,
      options
    )

    return streamSSE(c, async (stream) => {
      try {
        for await (const chunk of result.partialObjectStream) {
          stream.writeSSE({
            data: JSON.stringify(chunk),
          })
        }
        stream.close()
      } catch (_error) {
        stream.writeSSE({
          event: "error",
          data: JSON.stringify({ error: "Stream processing failed" }),
        })
        stream.close()
      }
    })
  } catch (error) {
    return await processError<typeof generateCodeFromFigma>(c, error, [
      "{{ default }}",
      "generate-code-from-figma",
    ])
  }
})

genaiRoutes.openapi(getFigmaImage, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { url } = c.req.valid("json")
    const figmaService = new FigmaService()
    const figmaImage = await figmaService.getFigmaImage(url)
    return c.json({ image: figmaImage }, 200)
  } catch (error) {
    return await processError<typeof getFigmaImage>(c, error, [
      "{{ default }}",
      "get-figma-image",
    ])
  }
})

genaiRoutes.openapi(generateMultipleUserStories, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { description, successCriteria, checklist, userTier, templateId } =
      c.req.valid("json")

    const template = await c
      .get("db")
      .selectFrom("storyTemplates")
      .selectAll()
      .where("id", "=", templateId)
      .executeTakeFirst()

    const userStories = await aiGenerateMultipleUserStories(
      c,
      description,
      successCriteria,
      checklist,
      userTier,
      template
    )

    return c.json({ userStories }, 200)
  } catch (error) {
    return await processError(c, error, [
      "{{ default }}",
      "generate-multiple-user-stories",
    ])
  }
})

export default genaiRoutes
