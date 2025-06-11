import { API } from "@incmix/utils/env"

export const BASE_PATH = API.TASKS

export const ERROR_PRESIGNED_URL = {
  namespace: "errors",
  key: "presigned_url",
}

export const ERROR_PROJECT_MEMBER_ALREADY_EXISTS = {
  namespace: "errors",
  key: "project_member_already_exists",
}

export const ERROR_PROJECT_MEMBER_REMOVE_FAILED = {
  namespace: "errors",
  key: "project_member_remove_failed",
}

export const ERROR_PROJECT_NOT_FOUND = {
  namespace: "errors",
  key: "project_not_found",
}
export const ERROR_COLUMN_NOT_FOUND = {
  namespace: "errors",
  key: "column_not_found",
}
export const ERROR_TASK_INSERT_FAIL = {
  namespace: "errors",
  key: "task_insert_fail",
}
export const ERROR_TASK_UPDATE_FAIL = {
  namespace: "errors",
  key: "task_update_fail",
}

export const ERROR_TASK_DELETE_FAIL = {
  namespace: "errors",
  key: "task_delete_fail",
}
export const ERROR_TASK_NOT_FOUND = {
  namespace: "errors",
  key: "task_not_found",
}

export const ERROR_ORG_NOT_FOUND = {
  namespace: "errors",
  key: "org_not_found",
}
export const ERROR_PROJECT_EXISTS = {
  namespace: "errors",
  key: "project_exists",
}
export const ERROR_PROJECT_CREATE_FAILED = {
  namespace: "errors",
  key: "project_create_failed",
}
export const ERROR_PROJECT_MEMBER_CREATE_FAILED = {
  namespace: "errors",
  key: "project_member_create_failed",
}
export const ERROR_PROJECT_UPDATE_FAILED = {
  namespace: "errors",
  key: "project_update_failed",
}
export const ERROR_PROJECT_DELETE_FAILED = {
  namespace: "errors",
  key: "project_delete_failed",
}
export const ERROR_COLUMN_CREATE_FAILED = {
  namespace: "errors",
  key: "column_create_failed",
}
export const ERROR_COLUMN_EXISTS = {
  namespace: "errors",
  key: "column_exists",
}
export const ERROR_COLUMN_UPDATE_FAILED = {
  namespace: "errors",
  key: "column_update_failed",
}
export const ERROR_PARENT_NOT_FOUND = {
  namespace: "errors",
  key: "parent_not_found",
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

export const ERROR_CHECKLIST_CREATE_FAILED = {
  namespace: "errors",
  key: "checklist_create_failed",
}

export const ERROR_CHECKLIST_UPDATE_FAILED = {
  namespace: "errors",
  key: "checklist_update_failed",
}

export const ERROR_CHECKLIST_NOT_FOUND = {
  namespace: "errors",
  key: "checklist_not_found",
}

export const MODEL_MAP = {
  claude: "claude-3-5-sonnet-20240620",
  gemini: "gemini-1.5-flash-latest",
}

export type AIModel = keyof typeof MODEL_MAP
