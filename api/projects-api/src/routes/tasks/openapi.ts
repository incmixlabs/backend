import { TaskSchema } from "@incmix-api/utils/zod-schema"
import { ResponseSchema } from "../types"
import {
  AddTaskChecklistSchema,
  BulkAiGenTaskSchema,
  ChecklistIdSchema,
  CreateTaskSchema,
  RemoveTaskChecklistSchema,
  TaskIdSchema,
  TaskJobsSchema,
  TaskListSchema,
  UpdateTaskChecklistSchema,
  UpdateTaskSchema,
} from "./types"

export const listTasksSchema = {
  response: {
    200: TaskListSchema,
    401: ResponseSchema,
    500: ResponseSchema,
  },
}

export const taskByIdSchema = {
  params: TaskIdSchema,
  response: {
    200: TaskSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const createTaskSchema = {
  body: CreateTaskSchema,
  response: {
    201: TaskSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    500: ResponseSchema,
  },
}

export const updateTaskSchema = {
  params: TaskIdSchema,
  body: UpdateTaskSchema,
  response: {
    200: TaskSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const deleteTaskSchema = {
  params: TaskIdSchema,
  response: {
    200: ResponseSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    500: ResponseSchema,
  },
}

export const addTaskChecklistSchema = {
  params: TaskIdSchema,
  body: AddTaskChecklistSchema,
  response: {
    201: TaskSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const updateTaskChecklistSchema = {
  params: ChecklistIdSchema,
  body: UpdateTaskChecklistSchema,
  response: {
    200: TaskSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const removeTaskChecklistSchema = {
  params: TaskIdSchema,
  body: RemoveTaskChecklistSchema,
  response: {
    200: TaskSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const bulkAiGenTaskSchema = {
  body: BulkAiGenTaskSchema,
  response: {
    200: ResponseSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const getJobStatusSchema = {
  response: {
    200: TaskJobsSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}
