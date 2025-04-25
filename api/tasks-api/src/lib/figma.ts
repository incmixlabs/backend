import { envVars } from "@/env-vars"
import Anthropic from "@anthropic-ai/sdk"
import { ServerError } from "@incmix-api/utils/errors"
import { MODEL_MAP, type AIModel } from "./constants"
import { GoogleGenAI } from "@google/genai"

type FigmaFileData = {
  name: string
  lastModified: string
  version: string
  document?: Node
  nodes?: {
    [key: string]: {
      document: Node
    }
  }
}

type Node = {
  id: string
  name: string
  type: string
  visible: boolean
  absoluteBoundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  layoutMode: string
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
  backgroundColor: {
    r: number
    g: number
    b: number
    a: number
  }
  style: {
    fontFamily: string
    fontSize: number
    fontWeight: number
    textAlignHorizontal: string
    textAlignVertical: string
  }
  fills: {
    color: string
  }[]
  strokes: {
    color: string
  }[]
  cornerRadius: number
  children: Node[]
  characters: string
}

type DesignElement = {
  id: string
  name: string
  type: string
  visible: boolean
  path: string[]
  size?: {
    width: number
    height: number
  }
  position?: {
    x: number
    y: number
  }
  layout?: string
  padding?: {
    left: number
    right: number
    top: number
    bottom: number
  }
  backgroundColor?: {
    r: number
    g: number
    b: number
    a: number
  }
  children?: DesignElement[]
  characters?: string
  style?: {
    fontFamily: string
    fontSize: number
    fontWeight: number
    textAlignHorizontal: string
    textAlignVertical: string
    color: string
  }
  fills?: {
    color: string
  }[]
  strokes?: {
    color: string
  }[]
  cornerRadius?: number
}

type DesignData = {
  name: string
  lastModified: string
  version: string
  elements: DesignElement
}

export class FigmaService {
  private readonly figmaApiUrl = "https://api.figma.com/v1"
  private figmaToken: string

  constructor() {
    if (!envVars.FIGMA_TOKEN) {
      throw new Error("Figma API is not available")
    }
    this.figmaToken = envVars.FIGMA_TOKEN
  }

  private parseFigmaUrl(url: string) {
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
      nodeId = figmaUrl.searchParams.get("node-id")?.replace("-", ":") ?? null

      if (!fileKey) {
        throw new Error("Could not extract file key from Figma URL")
      }

      return { fileKey, nodeId }
    } catch (error) {
      console.error("Error parsing Figma URL:", error)
      throw new Error(`Invalid Figma URL: ${(error as Error).message}`)
    }
  }

  async getFigmaImage(url: string) {
    const { fileKey, nodeId } = this.parseFigmaUrl(url)

    if (!fileKey) {
      throw new Error("Could not extract file key from Figma URL")
    }

    if (!nodeId) {
      throw new Error("Could not extract node ID from Figma URL")
    }

    const imageResponse = await fetch(
      `${this.figmaApiUrl}/images/${fileKey}?ids=${nodeId}&format=jpg`,
      {
        method: "get",
        headers: {
          "X-Figma-Token": this.figmaToken,
        },
      }
    ).then(
      (res) =>
        res.json() as Promise<{
          images: { [key: string]: string }
          err: string | null
        }>
    )

    if (!imageResponse.images?.[nodeId]) {
      throw new ServerError("Failed to fetch Figma File")
    }

    return imageResponse.images[nodeId]
  }

  private async getFigmaFileData(fileId: string, nodeId: string | null) {
    try {
      let url = `${this.figmaApiUrl}/files/${fileId}`

      // If node ID is provided, fetch just that node
      if (nodeId) {
        url = `${url}/nodes?ids=${nodeId}`
      }

      const response = await fetch(url, {
        headers: {
          "X-Figma-Token": this.figmaToken,
        },
      })

      return response.json() as Promise<FigmaFileData>
    } catch (error) {
      console.error("Error fetching Figma file data:", error)
      throw new Error(
        `Failed to fetch Figma design: ${(error as Error).message}`
      )
    }
  }

  private extractDesignElements(
    fileData: FigmaFileData,
    nodeId: string | null
  ) {
    // This is a simplified version - in production, you'd implement a more robust parser
    let document: Node

    if (nodeId && fileData.nodes) {
      // If we requested specific nodes
      document = fileData.nodes[nodeId]?.document

      if (!document) {
        throw new Error("Specified node not found in Figma file")
      }
    } else {
      // Full file
      if (!fileData.document) {
        throw new Error("No document found in Figma file")
      }

      document = fileData.document
    }

    // Process the document to extract components, styles, layout, etc.
    const extractedElements = this.processDocument(document)

    return {
      name: fileData.name,
      lastModified: fileData.lastModified,
      version: fileData.version,
      elements: extractedElements,
    }
  }

  processDocument(document: Node) {
    // This is a simplified implementation
    // A production version would recursively parse the Figma node tree

    function processNode(node: Node, path: string[] = []): DesignElement {
      const basicInfo = {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible,
        path: [...path, node.name],
      }

      // Extract properties based on node type
      switch (node.type) {
        case "FRAME":
        case "GROUP":
        case "COMPONENT":
        case "COMPONENT_SET":
        case "INSTANCE":
          return {
            ...basicInfo,
            size: {
              width: node.absoluteBoundingBox?.width,
              height: node.absoluteBoundingBox?.height,
            },
            position: {
              x: node.absoluteBoundingBox?.x,
              y: node.absoluteBoundingBox?.y,
            },
            layout: node.layoutMode,
            padding:
              node.paddingLeft !== undefined
                ? {
                    left: node.paddingLeft,
                    right: node.paddingRight,
                    top: node.paddingTop,
                    bottom: node.paddingBottom,
                  }
                : undefined,
            backgroundColor: node.backgroundColor,
            children: (node.children || []).map((child) =>
              processNode(child, [...path, node.name])
            ),
          }

        case "TEXT":
          return {
            ...basicInfo,
            characters: node.characters,
            style: {
              fontFamily: node.style?.fontFamily,
              fontSize: node.style?.fontSize,
              fontWeight: node.style?.fontWeight,
              textAlignHorizontal: node.style?.textAlignHorizontal,
              textAlignVertical: node.style?.textAlignVertical,
              color: node.fills?.[0]?.color,
            },
          }

        case "RECTANGLE":
        case "ELLIPSE":
        case "LINE":
        case "VECTOR":
          return {
            ...basicInfo,
            size: {
              width: node.absoluteBoundingBox?.width,
              height: node.absoluteBoundingBox?.height,
            },
            fills: node.fills,
            strokes: node.strokes,
            cornerRadius: node.cornerRadius,
          }

        default:
          return basicInfo
      }
    }

    return processNode(document)
  }

  async generateReactFromFigma(figmaUrl: string, userTier: "free" | "paid") {
    try {
      // Extract file ID and node ID (if any) from the Figma URL
      const { fileKey, nodeId } = this.parseFigmaUrl(figmaUrl)

      // Fetch file data from Figma API
      const fileData = await this.getFigmaFileData(fileKey, nodeId)

      // Extract relevant design elements
      const designElements = this.extractDesignElements(fileData, nodeId)

      const model: AIModel = userTier === "paid" ? "claude" : "gemini"
      if (model === "claude")
        // Generate React code using Claude API
        return await generateUsingClaude(designElements)

      return await generateUsingGemini(designElements)
    } catch (error) {
      console.error("Error generating React code from Figma:", error)
      throw error
    }
  }
}

async function generateUsingClaude(designElements: DesignData) {
  try {
    // Create prompt for Claude
    const prompt = createPrompt(designElements)

    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropicClient = new Anthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    // Call Claude API
    const response = await anthropicClient.messages.create({
      model: MODEL_MAP.claude,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system: `You are an expert React developer specializing in converting Figma designs to clean, maintainable React code.
              Your task is to analyze the provided Figma design elements and generate high-quality React components.
              Follow these guidelines:
              1. Use modern React best practices with functional components and hooks
              2. Apply the specified styling approach (Tailwind, CSS Modules, styled-components, etc.)
              3. Implement a responsive design when specified
              4. Add appropriate comments explaining complex logic or design decisions
              5. Organize code into modular components
              6. Use TypeScript type definitions when specified
              7. Focus on accessibility and semantic HTML
              8. Return only the code without additional explanations`,
    })

    // Extract the code from Claude's response
    if (Array.isArray(response.content)) {
      // Join all text blocks from the content array
      return response.content
        .filter((block: any) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n")
    }

    // Fallback in case content structure changes
    return typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content)
  } catch (error) {
    console.error("Error calling Claude API:", error)
    throw new Error(
      `Failed to generate React code: ${(error as Error).message}`
    )
  }
}

async function generateUsingGemini(designElements: DesignData) {
  try {
    // Create prompt for Gemini
    const prompt = createPrompt(designElements)

    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("Gemini AI Service is not available")
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey: envVars.GOOGLE_AI_API_KEY })

    const result = await genAI.models.generateContent({
      model: MODEL_MAP.gemini,
      contents: [
        {
          parts: [
            {
              text: `You are an expert React developer specializing in converting Figma designs to clean, maintainable React code.
        Your task is to analyze the provided Figma design elements and generate high-quality React components.
        Follow these guidelines:
        1. Use modern React best practices with functional components and hooks
        2. Apply the specified styling approach (Tailwind, CSS Modules, styled-components, etc.)
        3. Implement a responsive design when specified
        4. Add appropriate comments explaining complex logic or design decisions
        5. Organize code into modular components
        6. Use TypeScript type definitions when specified
        7. Focus on accessibility and semantic HTML
        8. Return only the code without additional explanations`,
            },
            { text: prompt },
          ],
        },
      ],
    })

    if (result.text?.length) return result.text

    throw new Error("No response from AI")
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    throw new Error(
      `Failed to generate React code: ${(error as Error).message}`
    )
  }
}

function createPrompt(designElements: DesignData) {
  // Convert design elements to JSON string for the prompt
  const designJSON = JSON.stringify(designElements, null, 2)

  return `
I need you to convert the following Figma design elements into React code.

# Design Elements (JSON format):
\`\`\`json
${designJSON}
\`\`\`

# Requirements:
- Framework: React
- Styling approach: Tailwind
- Make it responsive: Yes
- Use TypeScript: No

Please generate clean, well-structured React code that accurately represents this design.
Focus on creating reusable components and following best practices.

Important: Provide only the code without any prefatory text or instructions. Do not include phrases like "Here's the code" at the beginning of your response.
`
}
