import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai"
import type { StoryTemplate } from "@incmix-api/utils/db-schema"
import { type AIModel, MODEL_MAP } from "./constants"

export function getOrganizationById(c: Context, id: string) {
  return c
    .get("db")
    .selectFrom("organisations")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function generateUserStory(
  _c: Context,
  prompt: string,
  template: StoryTemplate,
  userTier: "free" | "paid" = "free"
): Promise<string> {
  // Use Claude for paid users, Gemini for free users
  const model = userTier === "paid" ? "claude" : "gemini"

  try {
    // Example implementation - In a real setup, you would:
    // 1. Call the appropriate AI API based on the model
    // 2. Handle authentication, rate limiting, etc.
    // 3. Process the response

    const enhancedPrompt = `
    Create a user story based on the following prompt: "${prompt}"

    Format as:
    ${template.content}
  `

    const userStory = await getAiResponseUsingTextPrompt(enhancedPrompt, model)
    return userStory
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
  // Format the prompt for user story generation

  if (model === "claude") {
    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropic = new Anthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    const msg = await anthropic.messages.create({
      model: MODEL_MAP[model],
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    if (Array.isArray(msg.content)) {
      // Join all text blocks from the content array
      return msg.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
    }

    // Fallback in case content structure changes
    return typeof msg.content === "string"
      ? msg.content
      : JSON.stringify(msg.content)
  }

  if (!envVars.GOOGLE_AI_API_KEY) {
    throw new Error("AI Service is not available")
  }

  const genAI = new GoogleGenAI({ apiKey: envVars.GOOGLE_AI_API_KEY })

  const response = await genAI.models.generateContent({
    model: MODEL_MAP[model],
    contents: prompt,
  })

  if (response.text?.length) return response.text

  throw new Error("No response from AI")
}

export async function generateUserStoryFromImage(
  imageUrl: string,
  prompt = "create a user story for a kanban board based on the image provided",
  userTier: "free" | "paid" = "free"
): Promise<string> {
  const enhancedPrompt = `
    Create a user story for Kanban board based on the following prompt: "${prompt}"

    Format as:
    As a [type of user], I want [goal] so that [benefit/value].

    [Design Description]

    Acceptance Criteria:
    - [criterion 1]
    - [criterion 2]
    - [criterion 3]


    Important: Provide only the user story without any prefatory text or instructions. Do not include phrases like "Here's a user story" at the beginning of your response.
  `

  const model = userTier === "paid" ? "claude" : "gemini"
  const userStory = await getAiResponseUsingImagePrompt(
    enhancedPrompt,
    imageUrl,
    model
  )
  return userStory
}

async function getAiResponseUsingImagePrompt(
  prompt: string,
  imageUrl: string,
  model: AIModel
): Promise<string> {
  // Format the prompt for user story generation

  if (model === "claude") {
    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropic = new Anthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
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
              source: {
                type: "url",
                url: imageUrl,
              },
            },
          ],
        },
      ],
    })

    if (Array.isArray(msg.content)) {
      // Join all text blocks from the content array
      return msg.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
    }

    // Fallback in case content structure changes
    return typeof msg.content === "string"
      ? msg.content
      : JSON.stringify(msg.content)
  }

  if (!envVars.GOOGLE_AI_API_KEY) {
    throw new Error("AI Service is not available")
  }

  const genAI = new GoogleGenAI({ apiKey: envVars.GOOGLE_AI_API_KEY })

  // Fetch the image and create a blob
  let imageBlob: Blob
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      )
    }

    const originalBlob = await response.blob()
    // Ensure the blob is treated as a JPG image
    imageBlob = new Blob([await originalBlob.arrayBuffer()], {
      type: response.headers.get("content-type") || "image/jpeg",
    })
  } catch (error) {
    console.error("Error fetching image:", error)
    throw new Error(`Failed to process image: ${(error as Error).message}`)
  }
  const file = await genAI.files.upload({
    file: imageBlob,
  })

  if (!file.uri || !file.mimeType) {
    throw new Error("Failed to upload image")
  }

  const response = await genAI.models.generateContent({
    model: MODEL_MAP[model],
    contents: [
      createUserContent([prompt, createPartFromUri(file.uri, file.mimeType)]),
    ],
  })

  if (response.text?.length) return response.text

  throw new Error("No response from AI")
}
