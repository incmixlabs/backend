import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { Node, RGBA } from "@figma/rest-api-spec"
import { ServerError } from "@incmix-api/utils/errors"
import { streamObject } from "ai"
import { z } from "zod"
import { envVars } from "@/env-vars"
import { type AIModel, MODEL_MAP } from "./constants"

// Shared schema for AI model responses
const FilesSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
      fileType: z.string(),
    })
  ),
})

type FigmaNode = Node

type FigmaFileData = {
  name: string
  lastModified: string
  version: string
  document?: FigmaNode
  nodes?: {
    [key: string]: {
      document: FigmaNode
    }
  }
}

type DesignElement = {
  id: string
  name: string
  type: string
  visible: boolean
  path: string[]
  size?: {
    width?: number
    height?: number
  }
  position?: {
    x?: number
    y?: number
  }
  layout?: string
  padding?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  backgroundColor?: string
  children?: DesignElement[]
  characters?: string
  style?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    textAlignHorizontal?: string
    textAlignVertical?: string
    color?: string
  }
  fills?: {
    color?: string
  }[]
  strokes?: {
    color?: string
  }[]
  cornerRadius?: number
}

type DesignData = {
  name: string
  lastModified: string
  version: string
  elements: DesignElement
}

type CodeGenerationOptions = {
  framework: "react" | "vue" | "angular" | "html"
  styling: "tailwind" | "css" | "styled-components" | "css-modules"
  typescript: boolean
  responsive: boolean
  accessibility: boolean
  componentLibrary?: string
}

const figmaColorToRgba = (color: RGBA) => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
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
      `${this.figmaApiUrl}/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=jpg`,
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
        url = `${url}/nodes?ids=${encodeURIComponent(nodeId)}`
      }

      const response = await fetch(url, {
        headers: {
          "X-Figma-Token": this.figmaToken,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Figma file data")
      }

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
    let document: FigmaNode

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

  processDocument(document: FigmaNode) {
    // This is a simplified implementation
    // A production version would recursively parse the Figma node tree

    function processNode(node: FigmaNode, path: string[] = []): DesignElement {
      const basicInfo = {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible ?? false,
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
            padding: {
              left: node.paddingLeft,
              right: node.paddingRight,
              top: node.paddingTop,
              bottom: node.paddingBottom,
            },
            backgroundColor:
              node.fills?.[0]?.type === "SOLID"
                ? figmaColorToRgba(node.fills[0].color)
                : undefined,
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
              color:
                node.fills?.[0]?.type === "SOLID"
                  ? figmaColorToRgba(node.fills[0].color)
                  : undefined,
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
            fills: node.fills?.map((fill) => ({
              color:
                fill.type === "SOLID"
                  ? figmaColorToRgba(fill.color)
                  : undefined,
            })),
            strokes: node.strokes?.map((stroke) => ({
              color:
                stroke.type === "SOLID"
                  ? figmaColorToRgba(stroke.color)
                  : undefined,
            })),
          }

        default:
          return basicInfo
      }
    }

    return processNode(document)
  }

  async generateReactFromFigma(
    figmaUrl: string,
    userTier: "free" | "paid",
    options: CodeGenerationOptions
  ) {
    try {
      // Extract file ID and node ID (if any) from the Figma URL
      const { fileKey, nodeId } = this.parseFigmaUrl(figmaUrl)

      // Fetch file data from Figma API
      const fileData = await this.getFigmaFileData(fileKey, nodeId)

      // Extract relevant design elements
      const designElements = this.extractDesignElements(fileData, nodeId)

      const prompt = createPrompt(designElements, options)
      const system = `You are an expert ${options.framework} developer specializing in converting Figma designs to clean, maintainable code.
      Your task is to analyze the provided Figma design elements and generate high-quality ${options.framework} components.
      Follow these guidelines:
      1. Use modern ${options.framework} best practices
      2. Apply the specified styling approach (${options.styling})
      3. Implement a responsive design when specified (${options.responsive})
      4. Add appropriate comments explaining complex logic or design decisions
      5. Organize code into modular components
      6. Use TypeScript type definitions when specified (${options.typescript})
      7. Focus on accessibility and semantic HTML when specified (${options.accessibility})
      8. Use the specified component library when provided (${options.componentLibrary || "none"})
      9. Return only the code without additional explanations`

      const model: AIModel = userTier === "paid" ? "claude" : "gemini"
      if (model === "claude") {
        if (!envVars.ANTHROPIC_API_KEY?.length) {
          throw new Error("Claude AI Service is not available")
        }
        // Generate React code using Claude API
        const anthropicClient = createAnthropic({
          apiKey: envVars.ANTHROPIC_API_KEY,
        })
        return streamObject({
          model: anthropicClient(MODEL_MAP.claude),
          schema: FilesSchema,
          system,
          prompt,
        })
      }
      if (!envVars.GOOGLE_AI_API_KEY) {
        throw new Error("Gemini AI Service is not available")
      }
      const geminiClient = createGoogleGenerativeAI({
        apiKey: envVars.GOOGLE_AI_API_KEY,
      })
      return streamObject({
        model: geminiClient(MODEL_MAP.gemini),
        schema: FilesSchema,
        system,
        prompt,
      })
    } catch (error) {
      console.error("Error generating React code from Figma:", error)
      throw error
    }
  }
}

function createPrompt(
  designElements: DesignData,
  options: CodeGenerationOptions
) {
  // Convert design elements to JSON string for the prompt
  const designJSON = JSON.stringify(designElements, null, 2)

  const frameworkInstructions = getFrameworkInstructions(options.framework)
  const stylingInstructions = getStylingInstructions(options.styling)
  const typescriptInstructions = options.typescript
    ? "Use TypeScript with proper type definitions."
    : "Use JavaScript."
  const responsiveInstructions = options.responsive
    ? "Make the design responsive and mobile-friendly."
    : "Focus on desktop layout only."
  const accessibilityInstructions = options.accessibility
    ? "Include proper accessibility features (ARIA labels, semantic HTML, keyboard navigation)."
    : "Basic accessibility is sufficient."
  const componentLibraryInstructions = options.componentLibrary
    ? `Use ${options.componentLibrary} component library for UI elements.`
    : "Use native HTML elements and custom styling."

  return `
I need you to convert the following Figma design elements into ${options.framework} code.

# Design Elements (JSON format):
\`\`\`json
${designJSON}
\`\`\`

# Requirements:
- Framework: ${options.framework}
- Styling approach: ${options.styling}
- Make it responsive: ${options.responsive}
- Use TypeScript: ${options.typescript}
- Include accessibility: ${options.accessibility}
- Component library: ${options.componentLibrary || "none"}

# Framework-specific instructions:
${frameworkInstructions}

# Styling instructions:
${stylingInstructions}

# Additional requirements:
- ${typescriptInstructions}
- ${responsiveInstructions}
- ${accessibilityInstructions}
- ${componentLibraryInstructions}

Split the code into multiple files if necessary, each file should be a separate component.

Please generate clean, well-structured ${options.framework} code that accurately represents this design.
Focus on creating reusable components and following best practices.
`
}

function getFrameworkInstructions(framework: string): string {
  switch (framework) {
    case "react":
      return "- Use functional components with hooks\n- Follow React best practices\n- Use JSX syntax\n- Implement proper component composition"
    case "vue":
      return "- Use Vue 3 Composition API\n- Use Single File Components (SFC)\n- Follow Vue best practices\n- Use Vue's template syntax"
    case "angular":
      return "- Use Angular components and modules\n- Follow Angular best practices\n- Use Angular template syntax\n- Implement proper dependency injection"
    case "html":
      return "- Use semantic HTML5 elements\n- Follow HTML best practices\n- Use proper document structure\n- Include necessary meta tags"
    default:
      return "- Follow standard web development best practices"
  }
}

function getStylingInstructions(styling: string): string {
  switch (styling) {
    case "tailwind":
      return "- Use Tailwind CSS utility classes\n- Follow Tailwind's responsive design patterns\n- Use Tailwind's color palette and spacing system"
    case "css":
      return "- Use vanilla CSS with proper organization\n- Follow CSS best practices\n- Use CSS custom properties for theming"
    case "styled-components":
      return "- Use styled-components for component styling\n- Follow styled-components best practices\n- Use theme provider for consistent styling"
    case "css-modules":
      return "- Use CSS Modules for scoped styling\n- Follow CSS Modules naming conventions\n- Use composition for reusable styles"
    default:
      return "- Use appropriate styling approach"
  }
}
