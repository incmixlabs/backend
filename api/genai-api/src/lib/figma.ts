import { envVars } from "@/env-vars"
import { CodeGenerationResponseSchema } from "@/routes/genai/types"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type {
  DocumentNode,
  GetFileNodesResponse,
  GetFileResponse,
  Node,
} from "@figma/rest-api-spec"
import { ServerError } from "@incmix-api/utils/errors"
import { streamObject } from "ai"
import { z } from "zod"
import { type AIModel, MODEL_MAP } from "./constants"

// Token limits for different models
const TOKEN_LIMITS = {
  claude: {
    input: 200000, // Claude 3.5 Sonnet context window
    output: 4000,
  },
  gemini: {
    input: 1000000, // Gemini Pro context window
    output: 8000,
  },
}

// Estimated tokens per character (rough approximation)
const TOKENS_PER_CHAR = 0.25

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
  backgroundColor?: {
    r?: number
    g?: number
    b?: number
    a?: number
  }
  children?: DesignElement[]
  characters?: string
  style?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    textAlignHorizontal?: string
    textAlignVertical?: string
    color?: string
    responsive?: boolean
  }
  fills?: {
    color?: string
  }[]
  strokes?: {
    color?: string
  }[]
  cornerRadius?: number
  effects?: {
    type: string
    visible: boolean
    radius?: number
    color?: {
      r: number
      g: number
      b: number
      a: number
    }
  }[]
  constraints?: {
    horizontal: string
    vertical: string
  }
  layoutAlign?: string
  layoutGrow?: number
  importance: number // For prioritization
}

type DesignData = {
  name: string
  lastModified: string
  version: string
  elements: DesignElement
  metadata: {
    totalElements: number
    visibleElements: number
    estimatedTokens: number
    complexity: "low" | "medium" | "high"
  }
}

type CodeGenerationOptions = {
  framework: "react" | "vue" | "angular" | "html"
  styling: "tailwind" | "css" | "styled-components" | "css-modules"
  typescript: boolean
  responsive: boolean
  accessibility: boolean
  componentLibrary?: string
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
    let fileKey: string | null = null
    let nodeId: string | null = null

    try {
      const figmaUrl = new URL(url)
      const pathParts = figmaUrl.pathname.split("/")

      if (
        pathParts.length >= 3 &&
        (pathParts[1] === "file" ||
          pathParts[1] === "design" ||
          pathParts[1] === "proto")
      ) {
        fileKey = pathParts[2]
      }

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

      return response.json() as Promise<GetFileNodesResponse>
    } catch (error) {
      console.error("Error fetching Figma file data:", error)
      throw new Error(
        `Failed to fetch Figma design: ${(error as Error).message}`
      )
    }
  }

  private calculateElementImportance(element: Node, depth = 0): number {
    let importance = 1

    // Reduce importance with depth
    importance *= Math.max(0.1, 1 - depth * 0.2)

    // Increase importance for interactive elements
    if (element.type === "COMPONENT" || element.type === "INSTANCE") {
      importance *= 2
    }

    // Increase importance for text elements (content is important)
    if (element.type === "TEXT" && element.characters) {
      importance *= 1.5
    }

    // Increase importance for visible elements
    if (element.visible) {
      importance *= 1.2
    }

    // Increase importance for elements with specific styling
    if ("style" in element && element.style) {
      importance *= 1.3
    }
    if ("fills" in element && element.fills) {
      importance *= 1.3
    }
    if ("strokes" in element && element.strokes) {
      importance *= 1.3
    }

    return importance
  }

  private processNode(
    node: Node,
    path: string[] = [],
    depth = 0
  ): DesignElement {
    const importance = this.calculateElementImportance(node, depth)

    const basicInfo = {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible ?? false,
      path: [...path, node.name],
      importance,
    }

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
            node.fills?.[0]?.type === "SOLID" ? node.fills[0].color : undefined,
          constraints: node.constraints,
          layoutAlign: node.layoutAlign,
          layoutGrow: node.layoutGrow,
          children: (node.children || [])
            .map((child) =>
              this.processNode(child, [...path, node.name], depth + 1)
            )
            .sort((a, b) => b.importance - a.importance), // Sort by importance
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
                ? node.fills[0].color.r.toString()
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
            color: fill.type === "SOLID" ? fill.color.r.toString() : undefined,
          })),
          strokes: node.strokes?.map((stroke) => ({
            color:
              stroke.type === "SOLID" ? stroke.color.r.toString() : undefined,
          })),
          cornerRadius:
            "cornerRadius" in node && node.cornerRadius !== undefined
              ? node.cornerRadius
              : undefined,
          effects: node.effects?.map((effect) => ({
            type: effect.type ?? "",
            visible: "visible" in effect ? effect.visible : false,
            radius: "radius" in effect ? effect.radius : undefined,
            color: "color" in effect && effect.color ? effect.color : undefined,
          })),
        }

      default:
        return basicInfo
    }
  }

  private extractDesignElements(
    fileData: GetFileNodesResponse,
    nodeId: string
  ): DesignData {
    const document = fileData.nodes[nodeId].document

    if (!document) {
      throw new Error("Specified node not found in Figma file")
    }

    const processedElements = this.processDocument(document)
    const metadata = this.calculateMetadata(processedElements)

    return {
      name: fileData.name,
      lastModified: fileData.lastModified,
      version: fileData.version,
      elements: processedElements,
      metadata,
    }
  }

  private processDocument(document: Node): DesignElement {
    return this.processNode(document)
  }

  private calculateMetadata(elements: DesignElement) {
    const countElements = (element: DesignElement): number => {
      let count = 1
      if (element.children) {
        count += element.children.reduce(
          (sum, child) => sum + countElements(child),
          0
        )
      }
      return count
    }

    const countVisibleElements = (element: DesignElement): number => {
      let count = element.visible ? 1 : 0
      if (element.children) {
        count += element.children.reduce(
          (sum, child) => sum + countVisibleElements(child),
          0
        )
      }
      return count
    }

    const totalElements = countElements(elements)
    const visibleElements = countVisibleElements(elements)
    const designJson = JSON.stringify(elements)
    const estimatedTokens = Math.ceil(designJson.length * TOKENS_PER_CHAR)

    let complexity: "low" | "medium" | "high" = "low"
    if (totalElements > 100) complexity = "high"
    else if (totalElements > 50) complexity = "medium"

    return {
      totalElements,
      visibleElements,
      estimatedTokens,
      complexity,
    }
  }

  // Strategy 1: Handle large design data by chunking and prioritizing
  private chunkDesignData(
    designData: DesignData,
    maxTokens: number
  ): DesignElement[] {
    const chunks: DesignElement[] = []
    let currentTokens = 0

    const addElementToChunks = (element: DesignElement) => {
      const elementJson = JSON.stringify(element)
      const elementTokens = Math.ceil(elementJson.length * TOKENS_PER_CHAR)

      if (currentTokens + elementTokens <= maxTokens) {
        chunks.push(element)
        currentTokens += elementTokens
      }
    }

    const processElement = (element: DesignElement) => {
      // Add high-importance elements first
      if (element.importance > 1.5) {
        addElementToChunks(element)
      }

      // Process children recursively
      if (element.children) {
        element.children.forEach(processElement)
      }

      // Add remaining elements if space allows
      if (element.importance <= 1.5) {
        addElementToChunks(element)
      }
    }

    processElement(designData.elements)
    return chunks
  }

  // Strategy 2: Progressive enhancement for large responses
  private async generateCodeWithProgressiveEnhancement(
    designChunks: DesignElement[],
    options: CodeGenerationOptions,
    model: AIModel
  ) {
    const basePrompt = this.createBasePrompt(options)
    const chunkPrompts = designChunks.map((chunk, index) =>
      this.createChunkPrompt(chunk, index + 1, designChunks.length, options)
    )

    try {
      if (model === "claude") {
        return this.generateWithClaudeObjectStream(basePrompt, chunkPrompts)
      }
      return this.generateWithGeminiObjectStream(basePrompt, chunkPrompts)
    } catch (error) {
      console.error("Error in progressive enhancement:", error)
      throw new Error("Code generation failed")
    }
  }

  private createBasePrompt(options: CodeGenerationOptions): string {
    return `
    You are an expert ${options.framework} developer specializing in converting Figma designs to clean, maintainable code.

    Framework: ${options.framework}
    Styling: ${options.styling}
    TypeScript: ${options.typescript}
    Responsive: ${options.responsive}
    Accessibility: ${options.accessibility}
    ${options.componentLibrary ? `Component Library: ${options.componentLibrary}` : ""}

    Generate a base structure with:
    1. Main component structure
    2. Layout containers
    3. Basic styling setup
    4. TypeScript interfaces (if enabled)
    5. Accessibility attributes (if enabled)

    Focus on creating a solid foundation that can be enhanced with detailed components.`
  }

  private createChunkPrompt(
    chunk: DesignElement,
    chunkIndex: number,
    totalChunks: number,
    options: CodeGenerationOptions
  ): string {
    const chunkJson = JSON.stringify(chunk, null, 2)

    return `
    Generate detailed ${options.framework} component for the following design element (chunk ${chunkIndex}/${totalChunks}):

    \`\`\`json
    ${chunkJson}
    \`\`\`

    Requirements:
    - Framework: ${options.framework}
    - Styling: ${options.styling}
    - TypeScript: ${options.typescript}
    - Responsive: ${options.responsive}
    - Accessibility: ${options.accessibility}

    Focus on:
    1. Accurate visual representation
    2. Proper component structure
    3. Responsive behavior
    4. Accessibility features
    5. Clean, maintainable code

    Return only the component code without explanations.`
  }

  // Strategy 3: Improve accuracy with design analysis
  private enhanceDesignData(designData: DesignData): DesignData {
    const enhancedElements = this.enhanceElement(designData.elements)

    return {
      ...designData,
      elements: enhancedElements,
    }
  }

  private enhanceElement(element: DesignElement): DesignElement {
    const enhanced = { ...element }

    // Add inferred properties
    if (enhanced.type === "TEXT" && enhanced.characters) {
      enhanced.style = {
        ...enhanced.style,
        // Infer text color from fills if not present
        color: enhanced.style?.color || enhanced.fills?.[0]?.color,
      }
    }

    // Add responsive hints
    if (enhanced.size?.width && enhanced.size.width > 768) {
      enhanced.style = {
        ...enhanced.style,
        // Mark as potentially mobile-responsive
        responsive: true,
      }
    }

    // Enhance children recursively
    if (enhanced.children) {
      enhanced.children = enhanced.children.map((child) =>
        this.enhanceElement(child)
      )
    }

    return enhanced
  }

  public async generateCodeFromFigma(
    figmaUrl: string,
    userTier: "free" | "paid" = "free",
    options: CodeGenerationOptions = {
      framework: "react",
      styling: "tailwind",
      typescript: false,
      responsive: true,
      accessibility: true,
    }
  ) {
    try {
      const { fileKey, nodeId } = this.parseFigmaUrl(figmaUrl)
      if (!nodeId) {
        throw new Error("No node ID found in Figma URL")
      }
      const fileData = await this.getFigmaFileData(fileKey, nodeId)
      const designData = this.extractDesignElements(fileData, nodeId)

      // Strategy 3: Enhance design data for better accuracy
      const enhancedDesignData = this.enhanceDesignData(designData)

      const model: AIModel = userTier === "paid" ? "claude" : "gemini"
      const tokenLimit = TOKEN_LIMITS[model].input

      // Strategy 1: Handle large design data
      if (enhancedDesignData.metadata.estimatedTokens > tokenLimit) {
        console.log(
          `Design data too large (${enhancedDesignData.metadata.estimatedTokens} tokens), chunking...`
        )
        const chunks = this.chunkDesignData(enhancedDesignData, tokenLimit)

        // Strategy 2: Progressive enhancement for large responses
        return this.generateCodeWithProgressiveEnhancement(
          chunks,
          options,
          model
        )
      }

      // For smaller designs, use direct generation
      return this.generateCodeDirectly(enhancedDesignData, options, model)
    } catch (error) {
      console.error("Error generating code from Figma:", error)
      throw error
    }
  }

  private generateCodeDirectly(
    designData: DesignData,
    options: CodeGenerationOptions,
    model: AIModel
  ) {
    const prompt = this.createCompletePrompt(designData, options)

    try {
      if (model === "claude") {
        return this.generateWithClaudeObjectStreamDirect(prompt)
      }
      return this.generateWithGeminiObjectStreamDirect(prompt)
    } catch (error) {
      console.error("Error in direct generation:", error)
      throw new Error("Code generation failed")
    }
  }

  private createCompletePrompt(
    designData: DesignData,
    options: CodeGenerationOptions
  ): string {
    const designJson = JSON.stringify(designData, null, 2)

    return `
    You are an expert ${options.framework} developer specializing in converting Figma designs to clean, maintainable code.

    # Design Data:
    \`\`\`json
    ${designJson}
    \`\`\`

    # Requirements:
    - Framework: ${options.framework}
    - Styling: ${options.styling}
    - TypeScript: ${options.typescript}
    - Responsive: ${options.responsive}
    - Accessibility: ${options.accessibility}
    ${options.componentLibrary ? `- Component Library: ${options.componentLibrary}` : ""}

    # Guidelines:
    1. Use modern ${options.framework} best practices
    2. Apply ${options.styling} styling approach
    3. Implement responsive design when specified
    4. Add accessibility features when enabled
    5. Use TypeScript when specified
    6. Create modular, reusable components
    7. Follow semantic HTML principles
    8. Add appropriate comments for complex logic

    # Design Analysis:
    - Total elements: ${designData.metadata.totalElements}
    - Visible elements: ${designData.metadata.visibleElements}
    - Complexity: ${designData.metadata.complexity}

    Generate clean, well-structured code that accurately represents this design. Focus on creating maintainable, accessible, and responsive components.

    Important: Provide only the code without any prefatory text or instructions.`
  }

  private generateWithClaudeObjectStream(
    basePrompt: string,
    chunkPrompts: string[]
  ) {
    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropic = createAnthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    // Create a custom object stream that combines base structure and components
    return streamObject({
      model: anthropic(MODEL_MAP.claude),
      prompt: this.createProgressivePrompt(basePrompt, chunkPrompts),
      schema: z.object({
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(),
            type: z.string(),
          })
        ),
      }),
      maxTokens: TOKEN_LIMITS.claude.output,
    })
  }

  private generateWithGeminiObjectStream(
    basePrompt: string,
    chunkPrompts: string[]
  ) {
    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const google = createGoogleGenerativeAI({
      apiKey: envVars.GOOGLE_AI_API_KEY,
    })

    // Create a custom object stream that combines base structure and components
    return streamObject({
      model: google(MODEL_MAP.gemini),
      prompt: this.createProgressivePrompt(basePrompt, chunkPrompts),
      schema: z.object({
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(),
            type: z.string(),
          })
        ),
      }),
      maxTokens: TOKEN_LIMITS.gemini.output,
    })
  }

  private createProgressivePrompt(
    basePrompt: string,
    chunkPrompts: string[]
  ): string {
    const chunksText = chunkPrompts
      .map((prompt, index) => `\n--- Component ${index + 1} ---\n${prompt}`)
      .join("\n")

    return `
    ${basePrompt}

    Now generate the detailed components for each design chunk. For each component, respond with a JSON object containing:
    - type: "status" for progress updates
    - type: "message" for code content
    - type: "done" when complete

    Components to generate:
    ${chunksText}

    Generate the complete code structure with all components. Respond with properly formatted JSON objects for each step.`
  }

  private generateWithClaudeObjectStreamDirect(prompt: string) {
    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropic = createAnthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    return streamObject({
      model: anthropic(MODEL_MAP.claude),
      prompt: this.createDirectPrompt(prompt),
      schema: z.object({
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(),
            type: z.string(),
          })
        ),
      }),
      maxTokens: TOKEN_LIMITS.claude.output,
    })
  }

  private generateWithGeminiObjectStreamDirect(prompt: string) {
    if (!envVars.GOOGLE_AI_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const google = createGoogleGenerativeAI({
      apiKey: envVars.GOOGLE_AI_API_KEY,
    })

    return streamObject({
      model: google(MODEL_MAP.gemini),
      prompt: this.createDirectPrompt(prompt),
      schema: z.object({
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(),
            type: z.string(),
          })
        ),
      }),
      maxTokens: TOKEN_LIMITS.gemini.output,
    })
  }

  private createDirectPrompt(prompt: string): string {
    return `
    ${prompt}

    Generate the complete code and respond with JSON objects containing:
    - type: "status" for progress updates
    - type: "message" for code content
    - type: "done" when complete

    Provide the code in structured JSON format.`
  }
}
