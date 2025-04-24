import { envVars } from "@/env-vars"
import Anthropic from "@anthropic-ai/sdk"
import { ServerError } from "@incmix-api/utils/errors"

export async function generateReactFromFigma(figmaUrl: string) {
  try {
    // Extract file ID and node ID (if any) from the Figma URL
    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl)

    // Fetch file data from Figma API
    const fileData = await getFigmaFileData(fileKey, nodeId)

    // Extract relevant design elements
    const designElements = extractDesignElements(fileData, nodeId)

    // Generate React code using Claude API
    const reactCode = await generateReactCode(designElements)

    return reactCode
  } catch (error) {
    console.error("Error generating React code from Figma:", error)
    throw error
  }
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

  const imageUrl = await getFigmaImage(fileKey, layerId)

  return imageUrl
}

export async function getFigmaImage(fileKey: string, layerId: string) {
  if (!envVars.FIGMA_TOKEN) {
    throw new Error("Figma API is not available")
  }
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

export async function getFigmaFileData(fileId: string, nodeId: string | null) {
  try {
    let url = `https://api.figma.com/v1/files/${fileId}`

    // If node ID is provided, fetch just that node
    if (nodeId) {
      url = `${url}/nodes?ids=${nodeId}`
    }

    if (!envVars.FIGMA_TOKEN) {
      throw new Error("Figma API is not available")
    }

    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": envVars.FIGMA_TOKEN,
      },
    })

    return response.json()
  } catch (error) {
    console.error("Error fetching Figma file data:", error)
    throw new Error(`Failed to fetch Figma design: ${(error as Error).message}`)
  }
}

export function extractDesignElements(fileData: any, nodeId: string | null) {
  // This is a simplified version - in production, you'd implement a more robust parser
  let document: any

  if (nodeId && fileData.nodes) {
    // If we requested specific nodes
    document = fileData.nodes[nodeId]?.document

    if (!document) {
      throw new Error("Specified node not found in Figma file")
    }
  } else {
    // Full file
    document = fileData.document
  }

  // Process the document to extract components, styles, layout, etc.
  const extractedElements = processDocument(document)

  return {
    name: fileData.name,
    lastModified: fileData.lastModified,
    version: fileData.version,
    elements: extractedElements,
    styles: fileData.styles || {},
  }
}

function processDocument(document: any) {
  // This is a simplified implementation
  // A production version would recursively parse the Figma node tree

  function processNode(node: any, path: any[] = []) {
    const basicInfo = {
      id: node.id,
      name: node.name,
      type: node.type,
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
          children: (node.children || []).map((child: any) =>
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

export async function generateReactCode(designElements: any) {
  try {
    // Create prompt for Claude
    const prompt = createPromptForClaude(designElements)

    if (!envVars.ANTHROPIC_API_KEY) {
      throw new Error("AI Service is not available")
    }

    const anthropicClient = new Anthropic({
      apiKey: envVars.ANTHROPIC_API_KEY,
    })

    // Call Claude API
    const response = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20240620",
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

function createPromptForClaude(designElements: any) {
  // Convert design elements to JSON string for the prompt
  const designJSON = JSON.stringify(designElements, null, 2)

  return `
I need you to convert the following Figma design elements into 'TypeScript React' code.

# Design Elements (JSON format):
\`\`\`json
${designJSON}
\`\`\`

# Requirements:
- Framework: React
- Styling approach: Tailwind
- Make it responsive: Yes
- Use TypeScript: Yes

Please generate clean, well-structured TypeScript React code that accurately represents this design.
Focus on creating reusable components and following best practices.

Important: Provide only the code without any prefatory text or instructions. Do not include phrases like "Here's the code" at the beginning of your response.
`
}
