import type { JSONSchemaType } from "ajv"

export interface GenerateUserStory {
  prompt: string
  userTier?: "free" | "paid"
  templateId: number
}

export interface UserStoryResponse {
  userStory: {
    description: string
    acceptanceCriteria: string[]
    checklist: string[]
  }
  imageUrl?: string
}

export interface Figma {
  url: string
  prompt?: string
  userTier?: "free" | "paid"
  templateId: number
}

export interface GenerateCodeFromFigma {
  url: string
  userTier?: "free" | "paid"
  framework?: "react" | "vue" | "angular" | "html"
  styling?: "tailwind" | "css" | "styled-components" | "css-modules"
  typescript?: boolean
  responsive?: boolean
  accessibility?: boolean
  componentLibrary?: string
}

export interface CodeGenerationResponse {
  type: "status" | "message" | "done" | "error"
  content?: string
  message?: string
  error?: string
  done?: boolean
}

export interface GenerateMultipleUserStories {
  description: string
  successCriteria: string[]
  checklist: string[]
  userTier?: "free" | "paid"
  templateId: number
}

export interface MultipleUserStoriesResponse {
  userStories: Array<{
    title: string
    description: string
    acceptanceCriteria: string[]
    checklist: string[]
  }>
}

export interface GenerateProjectHierarchy {
  projectDescription: string
  userTier?: "free" | "paid"
  templateId?: number
}

export interface ProjectHierarchyResponse {
  project: {
    title: string
    description: string
    epics: Array<{
      id: string
      title: string
      description: string
      features: Array<{
        id: string
        title: string
        description: string
        stories: Array<{
          id: string
          title: string
          description: string
          acceptanceCriteria: string[]
          estimatedPoints?: number
        }>
      }>
    }>
  }
}

export interface HealthCheck {
  status: string
  reason?: string
}

export interface Response {
  message: string
}

// Schemas
export const GenerateUserStorySchema: JSONSchemaType<GenerateUserStory> = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      minLength: 3,
      maxLength: 500,
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      nullable: true,
    },
    templateId: {
      type: "number",
    },
  },
  required: ["prompt", "templateId"],
  additionalProperties: false,
}

export const UserStoryResponseSchema: JSONSchemaType<UserStoryResponse> = {
  type: "object",
  properties: {
    userStory: {
      type: "object",
      properties: {
        description: { type: "string" },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
        },
        checklist: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["description", "acceptanceCriteria", "checklist"],
      additionalProperties: false,
    },
    imageUrl: {
      type: "string",
      format: "uri",
      nullable: true,
    },
  },
  required: ["userStory"],
  additionalProperties: false,
}

export const FigmaSchema: JSONSchemaType<Figma> = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    prompt: {
      type: "string",
      nullable: true,
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      nullable: true,
    },
    templateId: {
      type: "number",
    },
  },
  required: ["url", "templateId"],
  additionalProperties: false,
}

export const GenerateCodeFromFigmaSchema: JSONSchemaType<GenerateCodeFromFigma> = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      nullable: true,
    },
    framework: {
      type: "string",
      enum: ["react", "vue", "angular", "html"],
      nullable: true,
    },
    styling: {
      type: "string",
      enum: ["tailwind", "css", "styled-components", "css-modules"],
      nullable: true,
    },
    typescript: {
      type: "boolean",
      nullable: true,
    },
    responsive: {
      type: "boolean",
      nullable: true,
    },
    accessibility: {
      type: "boolean",
      nullable: true,
    },
    componentLibrary: {
      type: "string",
      nullable: true,
    },
  },
  required: ["url"],
  additionalProperties: false,
}

export const CodeGenerationResponseSchema: JSONSchemaType<CodeGenerationResponse> = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["status", "message", "done", "error"],
    },
    content: {
      type: "string",
      nullable: true,
    },
    message: {
      type: "string",
      nullable: true,
    },
    error: {
      type: "string",
      nullable: true,
    },
    done: {
      type: "boolean",
      nullable: true,
    },
  },
  required: ["type"],
  additionalProperties: false,
}

export const GenerateMultipleUserStoriesSchema: JSONSchemaType<GenerateMultipleUserStories> = {
  type: "object",
  properties: {
    description: {
      type: "string",
      minLength: 3,
      maxLength: 1000,
    },
    successCriteria: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    checklist: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      nullable: true,
    },
    templateId: {
      type: "number",
    },
  },
  required: ["description", "successCriteria", "checklist", "templateId"],
  additionalProperties: false,
}

export const MultipleUserStoriesResponseSchema: JSONSchemaType<MultipleUserStoriesResponse> = {
  type: "object",
  properties: {
    userStories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          acceptanceCriteria: {
            type: "array",
            items: { type: "string" },
          },
          checklist: {
            type: "array",
            items: { type: "string" },
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

export const GenerateProjectHierarchySchema: JSONSchemaType<GenerateProjectHierarchy> = {
  type: "object",
  properties: {
    projectDescription: {
      type: "string",
      minLength: 10,
      maxLength: 2000,
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      nullable: true,
    },
    templateId: {
      type: "number",
      nullable: true,
    },
  },
  required: ["projectDescription"],
  additionalProperties: false,
}

export const ProjectHierarchyResponseSchema: JSONSchemaType<ProjectHierarchyResponse> = {
  type: "object",
  properties: {
    project: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        epics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    stories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          description: { type: "string" },
                          acceptanceCriteria: {
                            type: "array",
                            items: { type: "string" },
                          },
                          estimatedPoints: {
                            type: "number",
                            nullable: true,
                          },
                        },
                        required: ["id", "title", "description", "acceptanceCriteria"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["id", "title", "description", "stories"],
                  additionalProperties: false,
                },
              },
            },
            required: ["id", "title", "description", "features"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "description", "epics"],
      additionalProperties: false,
    },
  },
  required: ["project"],
  additionalProperties: false,
}

export const HealthCheckSchema: JSONSchemaType<HealthCheck> = {
  type: "object",
  properties: {
    status: { type: "string" },
    reason: {
      type: "string",
      nullable: true,
    },
  },
  required: ["status"],
  additionalProperties: false,
}

export const ResponseSchema: JSONSchemaType<Response> = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
  additionalProperties: false,
}