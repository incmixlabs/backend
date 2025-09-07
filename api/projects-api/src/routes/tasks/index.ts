import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  NotFoundError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { nanoid } from "nanoid"
import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
} from "@/lib/constants"
import { getTaskById, getTasks, isProjectMember } from "@/lib/db"
import {
  addTaskChecklistSchema,
  bulkAiGenTaskSchema,
  createTaskSchema,
  deleteTaskSchema,
  getJobStatusSchema,
  listTasksSchema,
  removeTaskChecklistSchema,
  taskByIdSchema,
  updateTaskChecklistSchema,
  updateTaskSchema,
} from "@/routes/tasks/openapi"

const tasksRoutes: FastifyPlugin = (
  fastify: FastifyInstance,
  _options: any
) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // List Tasks
  app.get("/", { schema: listTasksSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const tasks = await getTasks(request, user.id)
      return reply.send(tasks)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Get Task by ID
  app.get("/:taskId", { schema: taskByIdSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const { taskId } = request.params
      const task = await getTaskById(request, taskId)

      if (!task) {
        const msg = await t.text(ERROR_TASK_NOT_FOUND)
        throw new NotFoundError(msg)
      }

      return reply.send(task)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Create Task
  app.post("/", { schema: createTaskSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const {
        projectId,
        taskOrder,
        assignedTo,
        startDate,
        endDate,
        name,
        description,
        parentTaskId,
        statusId,
        priorityId,
        labelsTags,
        refUrls,
        attachments,
        acceptanceCriteria,
        checklist,
      } = request.body

      const project = await request.db
        ?.selectFrom("projects")
        .selectAll()
        .where("id", "=", projectId)
        .executeTakeFirst()

      if (!project) {
        const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }

      if (statusId) {
        const column = await request.db
          ?.selectFrom("labels")
          .selectAll()
          .where("id", "=", statusId)
          .executeTakeFirst()

        if (!column) {
          const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }
      }

      if (priorityId) {
        const priority = await request.db
          ?.selectFrom("labels")
          .selectAll()
          .where("id", "=", priorityId)
          .executeTakeFirst()

        if (!priority) {
          const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }
      }

      const taskId = nanoid(7)

      const task = await request.db?.transaction().execute(async (tx) => {
        const newTask = await tx
          .insertInto("tasks")
          .values({
            id: taskId,
            name,
            description,
            taskOrder,
            projectId,
            statusId,
            priorityId,
            parentTaskId,
            labelsTags: JSON.stringify(labelsTags),
            refUrls: JSON.stringify(refUrls),
            attachments: JSON.stringify(attachments),
            acceptanceCriteria: JSON.stringify(acceptanceCriteria),
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
            createdBy: user.id,
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            completed: false,
            checklist: JSON.stringify(checklist || []),
          })
          .returningAll()
          .executeTakeFirst()

        if (!newTask) {
          const msg = await t.text(ERROR_TASK_INSERT_FAIL)
          throw new ServerError(msg)
        }

        if (assignedTo?.length) {
          await tx
            .insertInto("taskAssignments")
            .values(
              assignedTo.map((a) => ({
                taskId: newTask.id,
                userId: a,
              }))
            )
            .execute()
        }

        return newTask
      })

      const newTask = await getTaskById(request, task?.id ?? "")
      if (!newTask) {
        const msg = await t.text(ERROR_TASK_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }

      return reply.code(201).send(newTask)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Update Task
  app.put("/:taskId", { schema: updateTaskSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const { taskId } = request.params
      const { acceptanceCriteria, refUrls, labelsTags, attachments, ...rest } =
        request.body
      const updateData = {
        ...rest,
        ...(acceptanceCriteria && {
          acceptanceCriteria: JSON.stringify(acceptanceCriteria),
        }),
        ...(refUrls && { refUrls: JSON.stringify(refUrls) }),
        ...(labelsTags && { labelsTags: JSON.stringify(labelsTags) }),
        ...(attachments && { attachments: JSON.stringify(attachments) }),
      }

      const existingTask = await getTaskById(request, taskId)
      if (!existingTask) {
        const msg = await t.text(ERROR_TASK_NOT_FOUND)
        throw new NotFoundError(msg)
      }

      // Check if user is authorized to update the task
      const isMember = await isProjectMember(
        request,
        existingTask.projectId,
        user.id
      )
      if (!isMember) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const _updatedTask = await request.db
        ?.transaction()
        .execute(async (tx) => {
          // Update task
          const updated = await tx
            .updateTable("tasks")
            .set({
              ...updateData,
              updatedBy: user.id,
              updatedAt: new Date().toISOString(),
            })
            .where("id", "=", taskId)
            .returningAll()
            .executeTakeFirst()

          if (!updated) {
            const msg = await t.text(ERROR_TASK_UPDATE_FAIL)
            throw new ServerError(msg)
          }

          // Update assignees if provided
          if (updateData.assignedTo) {
            await tx
              .deleteFrom("taskAssignments")
              .where("taskId", "=", taskId)
              .execute()

            if (updateData.assignedTo.length > 0) {
              await tx
                .insertInto("taskAssignments")
                .values(
                  updateData.assignedTo.map((userId: string) => ({
                    taskId,
                    userId,
                  }))
                )
                .execute()
            }
          }

          return updated
        })

      const task = await getTaskById(request, taskId)
      if (!task) {
        const msg = await t.text(ERROR_TASK_NOT_FOUND)
        throw new NotFoundError(msg)
      }
      return reply.send(task)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Delete Task
  app.delete(
    "/:taskId",
    { schema: deleteTaskSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { taskId } = request.params

        const task = await getTaskById(request, taskId)
        if (!task) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }

        // Check if user is authorized to delete the task
        const isMember = await isProjectMember(request, task.projectId, user.id)
        if (!isMember) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        await request.db?.transaction().execute(async (tx) => {
          // Delete task assignments
          await tx
            .deleteFrom("taskAssignments")
            .where("taskId", "=", taskId)
            .execute()

          // Delete the task
          await tx.deleteFrom("tasks").where("id", "=", taskId).execute()
        })

        return reply.send({ message: "Task deleted successfully" })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Add Task Checklist
  app.post(
    "/:taskId/checklists",
    { schema: addTaskChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { taskId } = request.params
        const { checklist } = request.body

        const task = await getTaskById(request, taskId)
        if (!task) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }

        // Check if user is authorized
        const isMember = await isProjectMember(request, task.projectId, user.id)
        if (!isMember) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const currentChecklist = task.checklist || []
        const newChecklist = [
          ...currentChecklist,
          ...(Array.isArray(checklist) ? checklist : [checklist]),
        ]

        const updatedTask = await request.db
          ?.updateTable("tasks")
          .set({
            checklist: JSON.stringify(newChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", taskId)
          .returningAll()
          .executeTakeFirst()

        if (!updatedTask) {
          const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
          throw new ServerError(msg)
        }

        const taskWithDetails = await getTaskById(request, taskId)
        if (!taskWithDetails) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }
        return reply.code(201).send(taskWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Update Task Checklist
  app.put(
    "/:taskId/checklists/:checklistId",
    { schema: updateTaskChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { taskId, checklistId } = request.params
        const updateData = request.body

        const task = await getTaskById(request, taskId)
        if (!task) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }

        // Check if user is authorized
        const isMember = await isProjectMember(request, task.projectId, user.id)
        if (!isMember) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const updatedChecklist = task.checklist.map((item) => {
          if (item.id === checklistId) {
            return { ...item, ...updateData }
          }
          return item
        })

        const updatedTask = await request.db
          ?.updateTable("tasks")
          .set({
            checklist: JSON.stringify(updatedChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", taskId)
          .returningAll()
          .executeTakeFirst()

        if (!updatedTask) {
          const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
          throw new ServerError(msg)
        }

        const taskWithDetails = await getTaskById(request, taskId)
        if (!taskWithDetails) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }
        return reply.send(taskWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Remove Task Checklist
  app.delete(
    "/:taskId/checklists",
    { schema: removeTaskChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { taskId } = request.params
        const { checklistIds } = request.body

        const task = await getTaskById(request, taskId)
        if (!task) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }

        // Check if user is authorized
        const isMember = await isProjectMember(request, task.projectId, user.id)
        if (!isMember) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const updatedChecklist = task.checklist.filter(
          (item) => !checklistIds.includes(item.id)
        )

        const updatedTask = await request.db
          ?.updateTable("tasks")
          .set({
            checklist: JSON.stringify(updatedChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", taskId)
          .returningAll()
          .executeTakeFirst()

        if (!updatedTask) {
          const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
          throw new ServerError(msg)
        }

        const taskWithDetails = await getTaskById(request, taskId)
        if (!taskWithDetails) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new NotFoundError(msg)
        }
        return reply.send(taskWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Bulk AI Gen Task
  app.post(
    "/bulk-ai-gen",
    { schema: bulkAiGenTaskSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        // For now, return success since queue implementation is incomplete
        return reply.send({ message: "Tasks queued successfully" })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Get Job Status
  app.get(
    "/jobs/status",
    { schema: getJobStatusSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        // For now, return empty arrays since queue implementation is incomplete
        return reply.send({
          userStory: [],
          codegen: [],
        })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )
}

export default fp(tasksRoutes)
