import type { JSONSchemaType } from "ajv"

export const GenerateUserStorySchema: JSONSchemaType<{
  prompt: string
  userTier?: "free" | "paid"
  templateId: number
}> = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      minLength: 3,
      maxLength: 500,
      description: "A short description of the feature for user story generation",
      example: "create a dashboard",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      example: "free",
      nullable: true,
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use",
      example: 1,
    },
  },
  required: ["prompt", "templateId"],
  additionalProperties: false,
}

export interface UserStoryResponse {
  userStory: {
    description: string
    acceptanceCriteria: string[]
    checklist: string[]
  }
  imageUrl?: string
}

export const UserStoryResponseSchema: JSONSchemaType<UserStoryResponse> = {
  type: "object",
  properties: {
    userStory: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Generated user story in markdown format",
          example: "As a user, I want to create a dashboard so that I can monitor progress at a glance.",
        },
        acceptanceCriteria: {
          type: "array",
          items: { type: "string" },
          description: "Acceptance criteria for the user story",
          example: [
            "The dashboard should display key metrics",
            "Users can customize the layout",
            "Information updates in real-time",
          ],
        },
        checklist: {
          type: "array",
          items: { type: "string" },
          description: "Checklist for the user story",
          example: [
            "The dashboard should display key metrics",
            "Users can customize the layout",
            "Information updates in real-time",
          ],
        },
      },
      required: ["description", "acceptanceCriteria", "checklist"],
      additionalProperties: false,
    },
    imageUrl: {
      type: "string",
      format: "uri",
      description: "URL of the image",
      example: "https://www.figma.com/design/1234567890/1234567890",
      nullable: true,
    },
  },
  required: ["userStory"],
  additionalProperties: false,
}


export interface Figma {
  url: string
  prompt?: string
  userTier: "free" | "paid"
  templateId: number
}

export const FigmaSchema: JSONSchemaType<Figma> = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
      example: "https://www.figma.com/design/1234567890/1234567890",
    },
    prompt: {
      type: "string",
      description: "A short description of the feature for user story generation",
      example: "create a dashboard",
      nullable: true,
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      example: "free",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use",
      example: 1,
    },
  },
  required: ["url", "userTier", "templateId"],
  additionalProperties: false,
}

export interface GenerateCodeFromFigma {
  url: string
  userTier: "free" | "paid"
  framework: "react" | "vue" | "angular" | "html"
  styling: "tailwind" | "css" | "styled-components" | "css-modules"
  typescript: boolean
  responsive: boolean
  accessibility: boolean
  componentLibrary?: string
}

export const GenerateCodeFromFigmaSchema: JSONSchemaType<GenerateCodeFromFigma> = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
      description: "Figma design URL to generate code from",
      example: "https://www.figma.com/design/1234567890/1234567890",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      example: "free",
    },
    framework: {
      type: "string",
      enum: ["react", "vue", "angular", "html"],
      default: "react",
      description: "Target framework for code generation",
      example: "react",
    },
    styling: {
      type: "string",
      enum: ["tailwind", "css", "styled-components", "css-modules"],
      default: "tailwind",
      description: "Styling approach for the generated code",
      example: "tailwind",
    },
    typescript: {
      type: "boolean",
      default: false,
      description: "Whether to generate TypeScript code",
      example: false,
    },
    responsive: {
      type: "boolean",
      default: true,
      description: "Whether to generate responsive code",
      example: true,
    },
    accessibility: {
      type: "boolean",
      default: true,
      description: "Whether to include accessibility features",
      example: true,
    },
    componentLibrary: {
      type: "string",
      description: "Optional component library to use (e.g., material-ui, antd)",
      example: "material-ui",
      nullable: true,
    },
  },
  required: ["url", "userTier", "framework", "styling", "typescript", "responsive", "accessibility"],
  additionalProperties: false,
}

export interface CodeGenerationResponse {
  type: "status" | "message" | "done" | "error"
  content?: string
  message?: string
  error?: string
  done?: boolean
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

export interface GenerateMultipleUserStories {
  description: string
  successCriteria: string[]
  checklist: string[]
  userTier: "free" | "paid"
  templateId: number
}

export const GenerateMultipleUserStoriesSchema: JSONSchemaType<GenerateMultipleUserStories> = {
  type: "object",
  properties: {
    description: {
      type: "string",
      minLength: 3,
      maxLength: 1000,
      description: "Project description for user story generation",
      example: "A project management dashboard for tracking tasks and progress.",
    },
    successCriteria: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "Success criteria for the project",
      example: [
        "The dashboard should allow users to add, edit, and delete tasks.",
        "Users can filter tasks by status.",
      ],
    },
    checklist: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "Checklist items for the project",
      example: ["Implement authentication", "Set up database schema"],
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      example: "free",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use (optional)",
      example: 1,
    },
  },
  required: ["description", "successCriteria", "checklist", "userTier", "templateId"],
  additionalProperties: false,
}

export interface MultipleUserStoriesResponse {
  userStories: {
    title: string
    description: string
    acceptanceCriteria: string[]
    checklist: string[]
  }[]
}

export const MultipleUserStoriesResponseSchema: JSONSchemaType<MultipleUserStoriesResponse> = {
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
            example: "Add tasks to the dashboard",
          },
          description: {
            type: "string",
            description: "Generated user story description",
            example: "As a user, I want to add tasks to the dashboard so that I can track my work.",
          },
          acceptanceCriteria: {
            type: "array",
            items: { type: "string" },
            description: "Acceptance criteria for the user story",
            example: [
              "Tasks can be added with a title and description.",
              "Tasks appear in the dashboard immediately after creation.",
            ],
          },
          checklist: {
            type: "array",
            items: { type: "string" },
            description: "Checklist for the user story",
            example: ["Add task form UI", "API endpoint for task creation"],
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

export interface GenerateProjectHierarchy {
  projectDescription: string
  userTier: "free" | "paid"
  templateId?: number
}

export const GenerateProjectHierarchySchema: JSONSchemaType<GenerateProjectHierarchy> = {
  type: "object",
  properties: {
    projectDescription: {
      type: "string",
      minLength: 10,
      maxLength: 2000,
      description: "Detailed description of the project to generate epics, features, and stories for",
      example: "Create an ecommerce portal that accepts international orders and payments, and enables international shipments (split shipments), tracking and returns.",
    },
    userTier: {
      type: "string",
      enum: ["free", "paid"],
      default: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      example: "free",
    },
    templateId: {
      type: "number",
      description: "ID of the story template to use (optional)",
      example: 1,
      nullable: true,
    },
  },
  required: ["projectDescription", "userTier"],
  additionalProperties: false,
}

export interface ProjectHierarchyResponse {
  project: {
    title: string
    description: string
    epics: {
      id: string
      title: string
      description: string
      features: {
        id: string
        title: string
        description: string
        stories: {
          id: string
          title: string
          description: string
          acceptanceCriteria: string[]
          estimatedPoints?: number
        }[]
      }[]
    }[]
  }
}

export const ProjectHierarchyResponseSchema: JSONSchemaType<ProjectHierarchyResponse> = {
  type: "object",
  properties: {
    project: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Project title",
          example: "International E-Commerce Platform",
        },
        description: {
          type: "string",
          description: "Project description",
          example: "A comprehensive e-commerce solution with global capabilities",
        },
        epics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Epic identifier",
                example: "epic-1",
              },
              title: {
                type: "string",
                description: "Epic title",
                example: "User Management & Authentication",
              },
              description: {
                type: "string",
                description: "Epic description",
                example: "Comprehensive user account management system with secure authentication",
              },
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "Feature identifier",
                      example: "feature-1-1",
                    },
                    title: {
                      type: "string",
                      description: "Feature title",
                      example: "User Registration",
                    },
                    description: {
                      type: "string",
                      description: "Feature description",
                      example: "Allow users to create new accounts",
                    },
                    stories: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            description: "Story identifier",
                            example: "story-1-1-1",
                          },
                          title: {
                            type: "string",
                            description: "Story title",
                            example: "Email Registration",
                          },
                          description: {
                            type: "string",
                            description: "User story description",
                            example: "As a user, I want to register with my email so that I can create an account",
                          },
                          acceptanceCriteria: {
                            type: "array",
                            items: { type: "string" },
                            description: "Acceptance criteria for the user story",
                            example: [
                              "User can enter email and password",
                              "Email validation is performed",
                              "Password strength requirements are enforced",
                            ],
                          },
                          estimatedPoints: {
                            type: "number",
                            description: "Story points estimate",
                            example: 3,
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
