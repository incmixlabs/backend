import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai"
import { ServerError } from "@incmix-api/utils/errors"

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
  const storyTemplate = await getAiResponseUsingTextPrompt(
    enhancedPrompt,
    model
  )
  return storyTemplate
}

export const parseFigmaUrl = (url: string) => {
  // Extract file key and node ID from Figma URL
  // Figma URLs follow the pattern: https://www.figma.com/file/{fileKey}/{title}?node-id={nodeId}
  // or https://www.figma.com/design/{fileKey}/{title}?node-id={nodeId}

  // Initialize variables
  let fileKey: string | null = null
  let nodeId: string | null = null

  try {
    // Parse the URL
    const figmaUrl = new URL(url)
    const pathParts = figmaUrl.pathname.split("/")

    // Extract file key from path
    if (
      pathParts.length >= 3 &&
      (pathParts[1] === "file" ||
        pathParts[1] === "design" ||
        pathParts[1] === "proto")
    ) {
      fileKey = pathParts[2]
    }

    // Extract node ID from query parameters
    nodeId = figmaUrl.searchParams.get("node-id")

    if (!fileKey) {
      throw new Error("Could not extract file key from Figma URL")
    }

    return { fileKey, nodeId }
  } catch (error) {
    console.error("Error parsing Figma URL:", error)
    throw new Error(`Invalid Figma URL: ${(error as Error).message}`)
  }
}

export function extractLayerIdByName(
  figmaDocument: any,
  layerName: string
): string {
  // Function to recursively search for a layer by name
  function findLayerByName(node: any): string | null {
    // Check if current node matches the layer name
    if (node.name === layerName) {
      return node.id
    }

    // Check if node has children
    if (node.children && Array.isArray(node.children)) {
      // Search through all children
      for (const child of node.children) {
        const foundId = findLayerByName(child)
        if (foundId) {
          return foundId
        }
      }
    }

    // If we reach here, the layer wasn't found in this branch
    return null
  }

  // Start the search from the document root
  // Figma API typically returns nodes in a structure where we need to navigate to the actual content
  let rootNode = figmaDocument

  // Handle different possible document structures
  if (figmaDocument.nodes) {
    // If the document has a nodes property, get the first node
    const nodeIds = Object.keys(figmaDocument.nodes)
    if (nodeIds.length > 0) {
      rootNode = figmaDocument.nodes[nodeIds[0]].document
    }
  } else if (figmaDocument.document) {
    rootNode = figmaDocument.document
  }

  // Search for the layer
  const layerId = findLayerByName(rootNode)

  if (!layerId) {
    throw new Error(
      `Layer with name "${layerName}" not found in the Figma document`
    )
  }

  return layerId
}

export async function getFigmaFile(url: string, layerName: string) {
  const { fileKey, nodeId } = parseFigmaUrl(url)

  if (!fileKey || !nodeId) {
    throw new ServerError("Invalid Figma URL")
  }

  if (!envVars.FIGMA_TOKEN) {
    throw new Error("Figma API is not available")
  }

  const nodes = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
    {
      method: "get",
      headers: {
        "X-Figma-Token": envVars.FIGMA_TOKEN,
      },
    }
  ).then((res) => res.json())

  if (!nodes.nodes) {
    throw new ServerError("Failed to fetch Figma file")
  }

  const layerId = extractLayerIdByName(nodes, layerName)
  const imageResponse = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${layerId}&format=jpg`,
    {
      method: "get",
      headers: {
        "X-Figma-Token": envVars.FIGMA_TOKEN,
      },
    }
  ).then(
    (res) =>
      res.json() as Promise<{
        images: { [key: string]: string }
        err: string | null
      }>
  )

  if (!imageResponse.images?.[layerId]) {
    throw new ServerError("Failed to fetch Figma File")
  }

  return imageResponse.images[layerId]
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
  prompt: string,
  imageUrl: string,
  userTier: "free" | "paid" = "free"
): Promise<string> {
  const enhancedPrompt = `
    Create a user story for Kanban board based on the following prompt: "${prompt}"

    The user story should be based on the image provided.

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
