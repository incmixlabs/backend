export const BASE_PATH = "/api/genai"

export const ERROR_PRESIGNED_URL = {
  namespace: "errors",
  key: "presigned_url",
}

export const ERROR_USER_STORY_GENERATION_FAILED = {
  namespace: "errors",
  key: "user_story_generation_failed",
}
export const ERROR_TEMPLATE_ALREADY_EXISTS = {
  namespace: "errors",
  key: "template_already_exists",
}
export const ERROR_TEMPLATE_NOT_FOUND = {
  namespace: "errors",
  key: "template_not_found",
}

export const MODEL_MAP = {
  claude: "claude-3-5-sonnet-20240620",
  gemini: "gemini-1.5-flash-latest",
}

export type AIModel = keyof typeof MODEL_MAP
