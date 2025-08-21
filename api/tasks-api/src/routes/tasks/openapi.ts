import { createRoute } from "@hono/zod-openapi"
import { TaskSchema } from "@incmix-api/utils/zod-schema"
import { ResponseSchema } from "../types"
import {
  AddTaskChecklistSchema,
  ChecklistIdSchema,
  CreateTaskSchema,
  RemoveTaskChecklistSchema,
  TaskIdListSchema,
  TaskIdSchema,
  TaskListSchema,
  UpdateTaskChecklistSchema,
  UpdateTaskSchema,
  JobSchema,
} from "./types"
import { z } from "@hono/zod-openapi"

export const listTasks = createRoute({
  method: "get",
  path: "/",
  summary: "List Tasks",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskListSchema,
        },
      },
      description: "Returns All task for current User",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const taskById = createRoute({
  method: "get",
  path: "/{taskId}",
  summary: "Get Task",
  tags: ["Tasks"],
  description: "Get Task by Id",
  request: {
    params: TaskIdSchema,
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Returns a Task for given ID",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const createTask = createRoute({
  method: "post",
  path: "",
  summary: "Create Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Creates a new Task for current User",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task creation fails",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const updateTask = createRoute({
  method: "put",
  path: "/{taskId}",
  summary: "Update Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    params: TaskIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTaskSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Updates existing Task for current User",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task update fails",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const deleteTask = createRoute({
  method: "delete",
  path: "/{taskId}",
  summary: "Delete Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    params: TaskIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Deletes a Task for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when Task deletion fails",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const addTaskChecklist = createRoute({
  path: "/{taskId}/checklists",
  method: "post",
  summary: "Add Task Checklist",
  tags: ["Tasks"],
  description: "Add a new checklist item to a task",
  security: [{ cookieAuth: [] }],
  request: {
    params: TaskIdSchema,
    body: {
      content: {
        "application/json": {
          schema: AddTaskChecklistSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Added checklist item to task",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when Task does not exist",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const updateTaskChecklist = createRoute({
  path: "/{taskId}/checklists/{checklistId}",
  method: "put",
  summary: "Update Task Checklist",
  tags: ["Tasks"],
  description: "Update an existing checklist item in a task",
  security: [{ cookieAuth: [] }],
  request: {
    params: ChecklistIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTaskChecklistSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Updated checklist item in task",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when Task or Checklist does not exist",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const removeTaskChecklist = createRoute({
  method: "delete",
  path: "/{taskId}/checklists",
  summary: "Remove Task Checklist",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    params: TaskIdSchema,
    body: {
      content: {
        "application/json": {
          schema: RemoveTaskChecklistSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Removed checklists from task",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when checklist removal fails",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const bulkAiGenTask = createRoute({
  method: "post",
  path: "/bulk-ai-gen",
  summary: "Bulk AI Gen Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TaskIdListSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description:
        "Queues tasks for AI-generated content including descriptions, acceptance criteria, and checklists",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task update fails",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const getJobStatus = createRoute({
  method: "get",
  path: "/jobs/status",
  summary: "Get Job Status",
  tags: ["Tasks"],
  description: "Get the current status of a job by job ID",

  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: JobSchema.array(),
        },
      },
      description: "Returns the current status of the specified job",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when job not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})
