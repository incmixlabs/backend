// TypeScript interfaces for genai route types

export interface GenerateUserStoryRequest {
  prompt: string
  userTier: "free" | "paid"
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

export interface FigmaRequest {
  url: string
  prompt?: string
  userTier: "free" | "paid"
  templateId: number
}

export interface GenerateCodeFromFigmaRequest {
  url: string
  userTier: "free" | "paid"
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

export interface GenerateMultipleUserStoriesRequest {
  description: string
  successCriteria: string[]
  checklist: string[]
  userTier: "free" | "paid"
  templateId: number
}

export interface MultipleUserStoriesResponse {
  userStories: {
    title: string
    description: string
    acceptanceCriteria: string[]
    checklist: string[]
  }[]
}

export interface GenerateProjectHierarchyRequest {
  projectDescription: string
  userTier: "free" | "paid"
  templateId?: number
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
