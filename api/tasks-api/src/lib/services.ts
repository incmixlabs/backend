import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenAI } from "@google/genai"

export async function getOrganizationById(c: Context, id: string) {
  const url = `${envVars.ORG_URL}/id/${id}`

  const res = await fetch(url, {
    method: "get",
    headers: c.req.header(),
  })

  if (res.status !== 200 && res.status !== 404) {
    const data = (await res.json()) as { message: string }
    throw new Error(data.message)
  }

  if (res.status === 404) {
    return
  }

  return res.json()
}

const MODEL_MAP = {
  claude: "claude-3-5-sonnet-20240620",
  gemini: "gemini-1.5-flash-latest",
}

export type AIModel = keyof typeof MODEL_MAP

export async function generateUserStory(
  _c: Context,
  prompt: string,
  userTier: "free" | "paid" = "free"
): Promise<string> {
  // Use Claude for paid users, Gemini for free users
  const model = userTier === "paid" ? "claude" : "gemini"

  try {
    // Example implementation - In a real setup, you would:
    // 1. Call the appropriate AI API based on the model
    // 2. Handle authentication, rate limiting, etc.
    // 3. Process the response

    const userStory = await getAIResponse(prompt, model)
    return userStory
  } catch (error) {
    console.error(`Error generating user story with ${model}:`, error)
    throw new Error(
      `Failed to generate user story: ${(error as Error).message}`
    )
  }
}

async function getAIResponse(prompt: string, model: AIModel): Promise<string> {
  // Format the prompt for user story generation
  const enhancedPrompt = `
    Create a user story based on the following prompt: "${prompt}"

    Format as:
    As a [type of user], I want [goal] so that [benefit/value].

    Acceptance Criteria:
    - [criterion 1]
    - [criterion 2]
    - [criterion 3]

    Important: Provide only the user story without any prefatory text or instructions. Do not include phrases like "Here's a user story" at the beginning of your response.
  `

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
      messages: [{ role: "user", content: enhancedPrompt }],
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
    contents: enhancedPrompt,
  })

  if (response.text?.length) return response.text

  throw new Error("No response from AI")
}
