import { beforeAll, describe, expect, it, vi } from "vitest"
import app from "../src/index"
import {
  generateMockTask,
  getMockTaskWithAssignments,
  mockTasks,
} from "../src/lib/mock-data"

// Mock the environment variable
vi.mock("../src/env-vars", () => ({
  envVars: {
    MOCK_ENV: true,
    NODE_ENV: "test",
    PORT: 8888,
    DATABASE_URL: "postgresql://test",
    COOKIE_NAME: "test_session",
    INTL_API_URL: "http://localhost:9090",
    AUTH_API_URL: "http://localhost:8787",
    ORG_API_URL: "http://localhost:9292",
    DOMAIN: "localhost",
    REDIS_URL: "redis://localhost:6379",
    REDIS_PASSWORD: undefined,
  },
}))

describe("Mock Mode Tests", () => {
  describe("Mock Data Generation", () => {
    it("should generate a mock task with default values", () => {
      const task = generateMockTask()

      expect(task).toHaveProperty("id")
      expect(task.id).toMatch(/^mock-/)
      expect(task.name).toBe("Mock Task")
      expect(task.projectId).toBe("mock-project-1")
      expect(task.statusId).toBe("status-todo")
      expect(task.completed).toBe(false)
    })

    it("should generate a mock task with custom values", () => {
      const customData = {
        name: "Custom Task",
        description: "Custom description",
        priorityId: "priority-high",
        completed: true,
      }

      const task = generateMockTask(customData)

      expect(task.name).toBe("Custom Task")
      expect(task.description).toBe("Custom description")
      expect(task.priorityId).toBe("priority-high")
      expect(task.completed).toBe(true)
    })

    it("should get mock task with assignments", () => {
      const taskWithAssignments = getMockTaskWithAssignments("mock-task-1")

      expect(taskWithAssignments).toBeTruthy()
      expect(taskWithAssignments?.assignedTo).toBeDefined()
      expect(taskWithAssignments?.assignedTo.length).toBeGreaterThan(0)
      expect(taskWithAssignments?.comments).toBeDefined()
    })

    it("should return null for non-existent task", () => {
      const task = getMockTaskWithAssignments("non-existent-task")
      expect(task).toBeNull()
    })
  })

  describe("Mock API Endpoints", () => {
    const mockUser = {
      id: "test-user",
      email: "test@example.com",
      name: "Test User",
    }

    // Mock auth middleware to bypass authentication in tests
    beforeAll(() => {
      app.use("*", async (c, next) => {
        c.set("user", mockUser)
        await next()
      })
    })

    it("should return mock tasks list", async () => {
      const response = await app.request("/api/tasks/tasks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty("id")
      expect(data[0]).toHaveProperty("name")
      expect(data[0]).toHaveProperty("assignedTo")
    })

    it("should get a specific mock task by ID", async () => {
      const response = await app.request("/api/tasks/tasks/mock-task-1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe("mock-task-1")
      expect(data.name).toBe("Implement user authentication")
      expect(data.checklist).toBeDefined()
      expect(data.checklist.length).toBeGreaterThan(0)
    })

    it("should return 404 for non-existent task", async () => {
      const response = await app.request("/api/tasks/tasks/non-existent", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.message).toBe("Task not found")
    })

    it("should create a new mock task", async () => {
      const newTask = {
        name: "Test Task Creation",
        description: "Testing task creation in mock mode",
        projectId: "mock-project-1",
        statusId: "status-todo",
        priorityId: "priority-medium",
        taskOrder: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        labelsTags: ["test", "mock"],
        refUrls: [],
        attachments: [],
        acceptanceCriteria: ["Test passes"],
        checklist: [],
      }

      const response = await app.request("/api/tasks/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.name).toBe("Test Task Creation")
      expect(data.description).toBe("Testing task creation in mock mode")
      expect(data.id).toMatch(/^mock-/)
    })

    it("should update a mock task", async () => {
      const updateData = {
        name: "Updated Task Name",
        description: "Updated description",
      }

      const response = await app.request("/api/tasks/tasks/mock-task-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.name).toBe("Updated Task Name")
      expect(data.description).toBe("Updated description")
    })

    it("should delete a mock task", async () => {
      const response = await app.request("/api/tasks/tasks/mock-task-3", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe("Task deleted successfully")
    })

    it("should add checklist item to task", async () => {
      const checklistItem = {
        checklist: {
          text: "New checklist item",
          checked: false,
          order: 5,
        },
      }

      const response = await app.request(
        "/api/tasks/tasks/mock-task-1/checklist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checklistItem),
        }
      )

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.checklist).toBeDefined()
      const newItem = data.checklist.find(
        (item: any) => item.text === "New checklist item"
      )
      expect(newItem).toBeDefined()
    })

    it("should handle bulk AI generation request", async () => {
      const bulkRequest = {
        type: "user-story",
        taskIds: ["mock-task-1", "mock-task-2"],
      }

      const response = await app.request("/api/tasks/tasks/bulk-ai-gen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bulkRequest),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain("2 Tasks queued for AI generation")
    })

    it("should get job status", async () => {
      const response = await app.request("/api/tasks/tasks/job-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("userStory")
      expect(data).toHaveProperty("codegen")
      expect(Array.isArray(data.userStory)).toBe(true)
      expect(Array.isArray(data.codegen)).toBe(true)
    })
  })

  describe("Mock Data Validation", () => {
    it("should have valid mock tasks", () => {
      expect(mockTasks.length).toBeGreaterThan(0)

      mockTasks.forEach((task) => {
        expect(task.id).toBeDefined()
        expect(task.name).toBeDefined()
        expect(task.projectId).toBeDefined()
        expect(task.statusId).toBeDefined()
        expect(task.createdAt).toBeDefined()
        expect(typeof task.completed).toBe("boolean")
      })
    })

    it("should have consistent date formats", () => {
      mockTasks.forEach((task) => {
        expect(() => new Date(task.createdAt)).not.toThrow()
        expect(() => new Date(task.updatedAt)).not.toThrow()
        if (task.startDate) {
          expect(() => new Date(task.startDate)).not.toThrow()
        }
        if (task.endDate) {
          expect(() => new Date(task.endDate)).not.toThrow()
        }
      })
    })

    it("should have valid checklist structure", () => {
      mockTasks.forEach((task) => {
        if (task.checklist && task.checklist.length > 0) {
          task.checklist.forEach((item) => {
            expect(item).toHaveProperty("id")
            expect(item).toHaveProperty("text")
            expect(item).toHaveProperty("checked")
            expect(item).toHaveProperty("order")
            expect(typeof item.checked).toBe("boolean")
            expect(typeof item.order).toBe("number")
          })
        }
      })
    })
  })
})
