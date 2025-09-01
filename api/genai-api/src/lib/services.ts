import { envVars } from "@/env-vars"
import {
  type MultipleUserStoriesResponse,
  MultipleUserStoriesResponseSchema,
  type UserStoryResponse,
  UserStoryResponseSchema,
} from "@/routes/genai/types"
import type { Context } from "@/types"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { StoryTemplate } from "@incmix-api/utils/db-schema"
import { generateText, streamObject } from "ai"
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

export function formatProjectPrompt(
  prompt: string,
  template: string | undefined
): string {
  return `
  Create project description based on the following prompt: "${prompt}"

  return the result as a json object that can be directly passed to javascript's JSON.parse() function without any modifications:
  {project: {
    description: string,
    acceptanceCriteria: string[],
    checklist: string[],
  }}

  format description field as:
  ${template}

  Important: Provide only the project description without any prefatory text or instructions. Do not include phrases like "Here's a user story" at the beginning of your response.
  `
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
    })

    return result
  } catch (error) {
    console.error(`Error generating user story with ${model}:`, error)
    throw new Error(
      `Failed to generate user story: ${(error as Error).message}`
    )
  }
}

export function generateProject(
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
    const enhancedPrompt = formatProjectPrompt(prompt, promptTemplate)
    if (model === "claude") {
      if (!envVars.ANTHROPIC_API_KEY) {
        throw new Error("AI Service is not available")
      }

      const result = streamObject({
        model: anthropic(MODEL_MAP[model]),
        prompt: enhancedPrompt,
        schema: UserStoryResponseSchema.omit({ imageUrl: true }),
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
    })

    return result
  } catch (error) {
    console.error(`Error generating project with ${model}:`, error)
    throw new Error(`Failed to generate project: ${(error as Error).message}`)
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
      })

      return result.text
    }

    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const result = await generateText({
      model: google(MODEL_MAP[model]),
      prompt,
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

export async function generateMultipleUserStories(
  _c: Context,
  description: string,
  successCriteria: string[],
  checklist: string[],
  userTier: "free" | "paid" = "free",
  template?: StoryTemplate
) {
  const model = userTier === "paid" ? "claude" : "gemini"

  const promptTemplate =
    template?.content ||
    "As a [type of user], I want [goal] so that [benefit/value].\n\n[Design Description]\n\nAcceptance Criteria:\n- [criterion 1]\n- [criterion 2]\n- [criterion 3]"

  const aiPrompt = `
Given the following project details:

Description: ${description}
Success Criteria: ${successCriteria.map((c) => `- ${c}`).join("\n")}
Checklist: ${checklist.map((c) => `- ${c}`).join("\n")}

Generate 3 distinct user stories for this project. Each user story should be a JSON object with the following structure:
{
  title: string,
  description: string, // user story description
  acceptanceCriteria: string[],
  checklist: string[]
}

Return a JSON object with a single key 'userStories' whose value is an array of exactly 3 user stories. Use the following template for the description field of each user story:\n\n${promptTemplate}\n\nImportant: Provide only the JSON object, no extra text or explanation.`

  let aiResult: string
  if (model === "claude") {
    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }
    const result = await generateText({
      model: anthropic(MODEL_MAP[model]),
      prompt: aiPrompt,
    })
    aiResult = result.text
  } else {
    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }
    const result = await generateText({
      model: google(MODEL_MAP[model]),
      prompt: aiPrompt,
    })
    aiResult = result.text
  }

  // Remove code block markers if present
  const jsonString = aiResult
    .replace(/^```json\n/, "")
    .replace(/\n```$/, "")
    .replace(/```/, "")
  let parsed: MultipleUserStoriesResponse
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    console.error("Failed to parse JSON response from AI:", error)
    console.error("Raw output that failed to parse:", jsonString)
    throw new Error(
      "Invalid JSON response from AI - unable to parse user stories data"
    )
  }
  // Validate with zod
  const validated = MultipleUserStoriesResponseSchema.parse(parsed)
  return validated.userStories
}
