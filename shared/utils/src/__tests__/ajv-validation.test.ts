import { describe, expect, it } from "vitest"
import type { Task, User } from "../ajv-schema/projects"
import { validateTask, validateUser } from "../ajv-schema/projects"

describe("AJV Schema Validation", () => {
  describe("User validation", () => {
    it("should validate valid user data", () => {
      const validUser: User = {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      }

      const isValid = validateUser(validUser)
      expect(isValid).toBe(true)
      expect(validateUser.errors).toBeNull()
    })

    it("should reject user with missing required fields", () => {
      const invalidUser = {
        id: "user123",
        // missing name
      }

      const isValid = validateUser(invalidUser)
      expect(isValid).toBe(false)
      expect(validateUser.errors).not.toBeNull()
    })

    it("should reject user with invalid field types", () => {
      const invalidUser = {
        id: 123, // should be string
        name: "John Doe",
      }

      const isValid = validateUser(invalidUser)
      expect(isValid).toBe(false)
      expect(validateUser.errors).not.toBeNull()
    })
  })

  describe("Task validation", () => {
    it("should validate valid task data", () => {
      const validTask: Partial<Task> = {
        id: "task123",
        projectId: "project123",
        name: "Test Task",
        statusId: "status123",
        priorityId: "priority123",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: {
          id: "user123",
          name: "John Doe",
        },
        updatedBy: {
          id: "user123",
          name: "John Doe",
        },
      }

      const isValid = validateTask(validTask)
      expect(isValid).toBe(true)
      expect(validateTask.errors).toBeNull()
    })

    it("should reject task with missing required fields", () => {
      const invalidTask = {
        id: "task123",
        name: "Test Task",
        // missing other required fields
      }

      const isValid = validateTask(invalidTask)
      expect(isValid).toBe(false)
      expect(validateTask.errors).not.toBeNull()
    })
  })
})
