import { envVars } from "@/env-vars"
import {
  type UserStoryResponse,
  UserStoryResponseSchema,
} from "@/routes/genai/types"
import type { Context } from "@/types"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  type StreamObjectResult,
  generateObject,
  generateText,
  streamObject,
  streamText,
} from "ai"

import type { StoryTemplate } from "@incmix-api/utils/db-schema"
import { type AIModel, MODEL_MAP } from "./constants"

const anthropic = createAnthropic({
  apiKey: envVars.ANTHROPIC_API_KEY,
})

const google = createGoogleGenerativeAI({
  apiKey: envVars.GOOGLE_AI_API_KEY,
})
function formatUserStory(rawOutput: string): UserStoryResponse {
  const userStoryJsonString = rawOutput
    .replace(/^```json\n/, "")
    .replace(/\n```$/, "")
    .replace(/```/, "")

  try {
    return JSON.parse(userStoryJsonString) as UserStoryResponse
  } catch (error) {
    console.error("Failed to parse JSON response from AI:", error)
    console.error("Raw output that failed to parse:", userStoryJsonString)
    throw new Error(
      "Invalid JSON response from AI - unable to parse user story data"
    )
  }
}

export function formatUserStoryPrompt(
  prompt: string,
  template: string | undefined
): string {
  return `
  Create a user story based on the following prompt: "${prompt}"

  return the result as a json object that can be directly passed to javascript's JSON.parse() function without any modifications:
  {userStory: {
    description: string,
    acceptanceCriteria: string[],
    checklist: string[],
  }}

  format description field as:
  ${template}

  Important: Provide only the user story without any prefatory text or instructions. Do not include phrases like "Here's a user story" at the beginning of your response.
  `
}

export function generateUserStory(
  _c: Context,
  prompt: string,
  template?: StoryTemplate,
  userTier: "free" | "paid" = "free"
) {
  const model = userTier === "paid" ? "claude" : "gemini"

  const promptTemplate =
    template?.content ||
    `
  As a [type of user], I want [goal] so that [benefit/value].

  [Design Description]

  Acceptance Criteria:
  - [criterion 1]
  - [criterion 2]
  - [criterion 3]
  `

  try {
    const enhancedPrompt = formatUserStoryPrompt(prompt, promptTemplate)
    if (model === "claude") {
      if (!envVars.ANTHROPIC_API_KEY) {
        throw new Error("AI Service is not available")
      }

      const result = streamObject({
        model: anthropic(MODEL_MAP[model]),
        prompt: enhancedPrompt,
        schema: UserStoryResponseSchema,
        maxTokens: 1024,
      })
      return result
    }

    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const result = streamObject({
      model: google(MODEL_MAP[model]),
      prompt: enhancedPrompt,
      schema: UserStoryResponseSchema.omit({ imageUrl: true }),
      maxTokens: 1024,
    })

    return result
  } catch (error) {
    console.error(`Error generating user story with ${model}:`, error)
    throw new Error(
      `Failed to generate user story: ${(error as Error).message}`
    )
  }
}

export async function generateTemplate(
  _c: Context,
  prompt: string,
  userTier: "free" | "paid" = "free",
  format: "markdown" | "html" | "plainText" = "markdown"
): Promise<string> {
  // Use Claude for paid users, Gemini for free users
  const model = userTier === "paid" ? "claude" : "gemini"
  const enhancedPrompt = `
    Create a user story template for kanban board based on the following prompt: "${prompt}"
    don't specify any heading or title for story summary section.

    Make it so that it can be directly copied and pasted into a ${format} style text editor without any modifications. don't include any input fields or tables.

    Important: Provide only the story template without any prefatory text or instructions. Do not include phrases like "Here's a story template" at the beginning of your response.
  `
  const storyTemplate = await getAiResponseUsingTextPrompt(
    enhancedPrompt,
    model
  )
  return storyTemplate
}

async function getAiResponseUsingTextPrompt(
  prompt: string,
  model: AIModel
): Promise<string> {
  try {
    if (model === "claude") {
      if (!envVars.ANTHROPIC_API_KEY) {
        throw new Error("AI Service is not available")
      }

      const result = await generateText({
        model: anthropic(MODEL_MAP[model]),
        prompt,
        maxTokens: 1024,
      })

      return result.text
    }

    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const result = await generateText({
      model: google(MODEL_MAP[model]),
      prompt,
      maxTokens: 1024,
    })

    return result.text
  } catch (error) {
    console.error(`Error getting AI response with ${model}:`, error)
    throw new Error(`AI Service error: ${(error as Error).message}`)
  }
}

export async function generateUserStoryFromImage(
  imageUrl: string,
  prompt = "create a user story for a kanban board based on the image provided",
  userTier: "free" | "paid" = "free",
  template?: StoryTemplate
): Promise<UserStoryResponse> {
  const promptTemplate =
    template?.content ||
    `
  As a [type of user], I want [goal] so that [benefit/value].

  [Design Description]

  Acceptance Criteria:
  - [criterion 1]
  - [criterion 2]
  - [criterion 3]
  `
  const enhancedPrompt = formatUserStoryPrompt(prompt, promptTemplate)

  const model = userTier === "paid" ? "claude" : "gemini"
  const userStory = await getAiResponseUsingImagePrompt(
    enhancedPrompt,
    imageUrl,
    model
  )

  return formatUserStory(userStory)
}

async function getAiResponseUsingImagePrompt(
  prompt: string,
  imageUrl: string,
  model: AIModel
): Promise<string> {
  try {
    if (model === "claude") {
      if (!envVars.ANTHROPIC_API_KEY) {
        throw new Error("AI Service is not available")
      }

      const result = await generateText({
        model: anthropic(MODEL_MAP[model]),
        maxTokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                image: new URL(imageUrl),
              },
            ],
          },
        ],
      })

      return result.text
    }

    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const result = await generateText({
      model: google(MODEL_MAP[model]),
      maxTokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    })

    return result.text
  } catch (error) {
    console.error(`Error getting AI response with image using ${model}:`, error)
    throw new Error(`AI Service error: ${(error as Error).message}`)
  }
}
