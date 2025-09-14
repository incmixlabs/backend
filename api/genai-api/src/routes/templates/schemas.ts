// AJV schemas for template routes

export const storyTemplateSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    createdBy: { type: "string" },
  },
  required: ["id", "name", "content", "createdAt", "updatedAt"],
  additionalProperties: false,
}

export const storyTemplateArraySchema = {
  type: "array",
  items: storyTemplateSchema,
}

export const newStoryTemplateSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    content: { type: "string", minLength: 1 },
  },
  required: ["name", "content"],
  additionalProperties: false,
}

export const generateStoryTemplateSchema = {
  type: "object",
  properties: {
    prompt: { type: "string", minLength: 1 },
    userTier: { type: "string", enum: ["free", "paid"] },
    format: { type: "string", enum: ["markdown", "html", "plainText"] },
  },
  required: ["prompt", "userTier", "format"],
  additionalProperties: false,
}

export const generateStoryTemplateResponseSchema = {
  type: "object",
  properties: {
    template: { type: "string" },
  },
  required: ["template"],
  additionalProperties: false,
}

export const errorResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    status: { type: "number" },
  },
  required: ["message"],
  additionalProperties: false,
}
