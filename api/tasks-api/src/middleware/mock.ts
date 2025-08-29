import { envVars } from "@/env-vars"
import {
  generateMockTask,
  getAllMockTasksWithAssignments,
  getMockTaskWithAssignments,
  mockLabels,
  mockProjects,
  mockTasks,
} from "@/lib/mock-data"
import type { Context, Next } from "hono"
import { nanoid } from "nanoid"

export async function mockMiddleware(c: Context, next: Next) {
  // Only apply mock middleware if MOCK_DATA is true
  if (!envVars.MOCK_DATA) {
    return next()
  }

  const path = c.req.path
  const method = c.req.method

  // Mock responses for tasks endpoints
  if (path.includes("/api/tasks")) {
    // List all tasks
    if (path === "/api/tasks/tasks" && method === "GET") {
      console.log("🎭 MOCK MODE: Returning mock tasks list")
      return c.json(getAllMockTasksWithAssignments(), 200)
    }

    // Job status (before individual task ID check)
    if (path === "/api/tasks/tasks/job-status" && method === "GET") {
      console.log("🎭 MOCK MODE: Getting job status")

      return c.json(
        {
          userStory: [
            {
              taskId: "mock-task-1",
              jobTitle: "Mock User Story Generation",
              status: "completed",
              jobId: "mock-job-1",
            },
          ],
          codegen: [
            {
              taskId: "mock-task-2",
              jobTitle: "Mock Code Generation",
              status: "active",
              jobId: "mock-job-2",
            },
          ],
        },
        200
      )
    }

    // Get task by ID
    const taskByIdMatch = path.match(/\/api\/tasks\/tasks\/([^/]+)$/)
    if (taskByIdMatch && method === "GET") {
      const taskId = taskByIdMatch[1]
      console.log(`🎭 MOCK MODE: Getting task ${taskId}`)
      const task = getMockTaskWithAssignments(taskId)

      if (task) {
        return c.json(task, 200)
      }
      return c.json({ message: "Task not found" }, 404)
    }

    // Create new task
    if (path === "/api/tasks/tasks" && method === "POST") {
      const body = await c.req.json()
      console.log("🎭 MOCK MODE: Creating new task", body)

      const newTask = generateMockTask({
        ...body,
        id: `mock-${nanoid(7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Add to mock tasks array (in memory only)
      mockTasks.push(newTask)

      return c.json(
        {
          ...newTask,
          assignedTo: [],
          comments: [],
        },
        201
      )
    }

    // Update task
    const updateMatch = path.match(/\/api\/tasks\/tasks\/([^/]+)$/)
    if (updateMatch && method === "PUT") {
      const taskId = updateMatch[1]
      const body = await c.req.json()
      console.log(`🎭 MOCK MODE: Updating task ${taskId}`, body)

      const taskIndex = mockTasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        mockTasks[taskIndex] = {
          ...mockTasks[taskIndex],
          ...body,
          updatedAt: new Date().toISOString(),
        }
        return c.json(getMockTaskWithAssignments(taskId), 200)
      }
      return c.json({ message: "Task not found" }, 404)
    }

    // Delete task
    const deleteMatch = path.match(/\/api\/tasks\/tasks\/([^/]+)$/)
    if (deleteMatch && method === "DELETE") {
      const taskId = deleteMatch[1]
      console.log(`🎭 MOCK MODE: Deleting task ${taskId}`)

      const taskIndex = mockTasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1)
        return c.json({ message: "Task deleted successfully" }, 200)
      }
      return c.json({ message: "Task not found" }, 404)
    }

    // Add checklist item
    const addChecklistMatch = path.match(
      /\/api\/tasks\/tasks\/([^/]+)\/checklist$/
    )
    if (addChecklistMatch && method === "POST") {
      const taskId = addChecklistMatch[1]
      const body = await c.req.json()
      console.log(`🎭 MOCK MODE: Adding checklist to task ${taskId}`, body)

      const task = mockTasks.find((t) => t.id === taskId)
      if (task) {
        const newChecklist = {
          id: nanoid(6),
          text: body.checklist.text,
          checked: body.checklist.checked || false,
          order: body.checklist.order || task.checklist.length + 1,
        }
        task.checklist.push(newChecklist)
        return c.json(getMockTaskWithAssignments(taskId), 201)
      }
      return c.json({ message: "Task not found" }, 404)
    }

    // Update checklist item
    const updateChecklistMatch = path.match(
      /\/api\/tasks\/tasks\/([^/]+)\/checklist\/([^/]+)$/
    )
    if (updateChecklistMatch && method === "PUT") {
      const [, taskId, checklistId] = updateChecklistMatch
      const body = await c.req.json()
      console.log(
        `🎭 MOCK MODE: Updating checklist ${checklistId} in task ${taskId}`,
        body
      )

      const task = mockTasks.find((t) => t.id === taskId)
      if (task) {
        const checklistIndex = task.checklist.findIndex(
          (c) => c.id === checklistId
        )
        if (checklistIndex !== -1) {
          task.checklist[checklistIndex] = {
            ...task.checklist[checklistIndex],
            ...body.checklist,
          }
          return c.json(getMockTaskWithAssignments(taskId), 200)
        }
      }
      return c.json({ message: "Checklist item not found" }, 404)
    }

    // Remove checklist items
    const removeChecklistMatch = path.match(
      /\/api\/tasks\/tasks\/([^/]+)\/checklist$/
    )
    if (removeChecklistMatch && method === "DELETE") {
      const taskId = removeChecklistMatch[1]
      const body = await c.req.json()
      console.log(
        `🎭 MOCK MODE: Removing checklist items from task ${taskId}`,
        body
      )

      const task = mockTasks.find((t) => t.id === taskId)
      if (task) {
        task.checklist = task.checklist.filter(
          (c) => !body.checklistIds.includes(c.id)
        )
        return c.json(getMockTaskWithAssignments(taskId), 200)
      }
      return c.json({ message: "Task not found" }, 404)
    }

    // Bulk AI generation
    if (path === "/api/tasks/tasks/bulk-ai-gen" && method === "POST") {
      const body = await c.req.json()
      console.log("🎭 MOCK MODE: Bulk AI generation", body)

      return c.json(
        {
          message: `${body.taskIds.length} Tasks queued for AI generation (MOCK)`,
        },
        200
      )
    }
  }

  // Continue to next middleware if no mock response was provided
  return next()
}
