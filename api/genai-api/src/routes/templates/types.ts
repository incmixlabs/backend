import type { JSONSchemaType } from "ajv"

export interface StoryTemplate {
  id: number
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface NewStoryTemplate {
  name: string
  content: string
}

export interface UpdatedStoryTemplate {
  id?: number
  name?: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

export const storyTemplateSchema: JSONSchemaType<StoryTemplate> = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "content", "createdAt", "updatedAt"],
  additionalProperties: false,
}

export const newStoryTemplateSchema: JSONSchemaType<NewStoryTemplate> = {
  type: "object",
  properties: {
    name: { type: "string" },
    content: { type: "string" },
  },
  required: ["name", "content"],
  additionalProperties: false,
}

export const updatedStoryTemplateSchema: JSONSchemaType<UpdatedStoryTemplate> = {
  type: "object",
  properties: {
    id: { type: "number", nullable: true },
    name: { type: "string", nullable: true },
    content: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time", nullable: true },
    updatedAt: { type: "string", format: "date-time", nullable: true },
  },
  required: [],
  additionalProperties: false,
}
