// AJV schemas for genai routes
export const generateUserStorySchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      minLength: 3,
      maxLength: 500,
      description:
        "A short description of the feature for user story generation",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use",
    },
  },
  required: ["prompt", "userTier", "templateId"],
  additionalProperties: false,
}

export const userStoryResponseSchema = {
  type: "object",
  properties: {
    userStory: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Generated user story in markdown format",
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description: "Acceptance criteria for the user story",
        },
        checklist: {
          type: "array",
          items: { type: "string" },
          description: "Checklist for the user story",
        },
      },
      required: ["description", "acceptanceCriteria", "checklist"],
      additionalProperties: false,
    },
    imageUrl: {
      type: "string",
      format: "uri",
      description: "URL of the image",
    },
  },
  required: ["userStory"],
  additionalProperties: false,
}

export const figmaSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    prompt: {
      type: "string",
      description:
        "A short description of the feature for user story generation",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use",
    },
  },
  required: ["url", "userTier", "templateId"],
  additionalProperties: false,
}

export const generateCodeFromFigmaSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
      description: "Figma design URL to generate code from",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    },
    framework: {
      type: "string",
      enum: ["react", "vue", "angular", "html"],
      default: "react",
      description: "Target framework for code generation",
    },
    styling: {
      type: "string",
      enum: ["tailwind", "css", "styled-components", "css-modules"],
      default: "tailwind",
      description: "Styling approach for the generated code",
    },
    typescript: {
      type: "boolean",
      default: false,
      description: "Whether to generate TypeScript code",
    },
    responsive: {
      type: "boolean",
      default: true,
      description: "Whether to generate responsive code",
    },
    accessibility: {
      type: "boolean",
      default: true,
      description: "Whether to include accessibility features",
    },
    componentLibrary: {
      type: "string",
      description:
        "Optional component library to use (e.g., material-ui, antd)",
    },
  },
  required: ["url", "userTier"],
  additionalProperties: false,
}

export const generateMultipleUserStoriesSchema = {
  type: "object",
  properties: {
    description: {
      type: "string",
      minLength: 3,
      maxLength: 1000,
      description: "Project description for user story generation",
    },
    successCriteria: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "Success criteria for the project",
    },
    checklist: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "Checklist items for the project",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use (optional)",
    },
  },
  required: [
    "description",
    "successCriteria",
    "checklist",
    "userTier",
    "templateId",
  ],
  additionalProperties: false,
}

export const multipleUserStoriesResponseSchema = {
  type: "object",
  properties: {
    userStories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Generated user story title",
          },
          description: {
            type: "string",
            description: "Generated user story description",
          },
          acceptanceCriteria: {
            type: "array",
            items: { type: "string" },
            description: "Acceptance criteria for the user story",
          },
          checklist: {
            type: "array",
            items: { type: "string" },
            description: "Checklist for the user story",
          },
        },
        required: ["title", "description", "acceptanceCriteria", "checklist"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["userStories"],
  additionalProperties: false,
}

export const generateProjectHierarchySchema = {
  type: "object",
  properties: {
    projectDescription: {
      type: "string",
      minLength: 10,
      maxLength: 2000,
      description:
        "Detailed description of the project to generate epics, features, and stories for",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use (optional)",
    },
  },
  required: ["projectDescription", "userTier"],
  additionalProperties: false,
}

export const getFigmaImageSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
  },
  required: ["url"],
  additionalProperties: false,
}

export const getFigmaImageResponseSchema = {
  type: "object",
  properties: {
    image: {
      type: "string",
    },
  },
  required: ["image"],
  additionalProperties: false,
}

// Common error response schema
export const errorResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    status: {
      type: "number",
    },
  },
  required: ["message"],
  additionalProperties: false,
}

// SSE streaming response schemas
export const sseDataSchema = {
  type: "object",
  properties: {
    data: {
      type: "string",
    },
  },
  required: ["data"],
  additionalProperties: false,
}

export const sseCodeDataSchema = {
  type: "object",
  properties: {
    event: {
      type: "string",
      enum: ["message", "status", "done", "error"],
    },
    data: {
      type: "string",
    },
  },
  required: ["data"],
  additionalProperties: false,
}
