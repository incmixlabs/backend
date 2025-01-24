import { env } from "cloudflare:test"
import app from "@"
import { BASE_PATH } from "@/lib/constants"
import {
  createTask,
  deleteTask,
  listTasks,
  taskById,
  updateTask,
} from "@/routes/tasks/openapi"
import {
  defaultHeaders,
  insertColumn,
  insertProject,
  insertTask,
} from "@/test/test-utils"
import type { Task } from "@incmix/utils/types"
import { beforeAll, describe, expect, test } from "vitest"

describe("Todo worker tests", () => {
  beforeAll(async () => {
    await insertProject(env.DB, {
      id: "project_1",
      orgId: "12345",
      name: "Test project",
      createdBy: "user_1",
      updatedBy: "user_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await insertColumn(env.DB, {
      id: "column_1",
      projectId: "project_1",
      label: "Test Column",
      columnOrder: 1,
      createdBy: "user_1",
      updatedBy: "user_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await insertTask(env.DB, {
      id: "task_1",
      assignedTo: "user_1",
      createdBy: "user_1",
      updatedBy: "user_1",
      columnId: "column_1",
      content: "task 1",
      taskOrder: 1,
      projectId: "project_1",
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await insertTask(env.DB, {
      id: "task_2",
      assignedTo: "user_1",
      createdBy: "user_1",
      updatedBy: "user_1",
      columnId: "column_1",
      content: "task 2",
      taskOrder: 1,
      projectId: "project_1",
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await insertTask(env.DB, {
      id: "task_3",
      assignedTo: "user_1",
      createdBy: "user_1",
      updatedBy: "user_1",
      columnId: "column_1",
      content: "task 3",
      taskOrder: 1,
      projectId: "project_1",
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return async () => {
      await env.DB.exec("delete from tasks")
    }
  })
  test("Try Get tasks for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + listTasks.getRoutingPath(),
      {
        method: "GET",
        headers: defaultHeaders,
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Get task by ID for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + taskById.getRoutingPath().replace(":id", "task_"),
      {
        method: "GET",
        headers: defaultHeaders,
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Update task by ID for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "task_1"),
      {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify({
          completed: true,
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Create task for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + createTask.getRoutingPath(),
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          status: "todo",
          content: "Task Title",
          taskOrder: 1,
          assignedTo: "user_1",
          columnId: "column_1",
          projectId: "column_2",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Delete task for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "task_1"),
      {
        method: "DELETE",
        headers: defaultHeaders,
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Get tasks for invalid User", async () => {
    const res = await app.request(
      BASE_PATH + listTasks.getRoutingPath(),
      {
        method: "GET",
        headers: {
          ...defaultHeaders,
          cookie: `${env.COOKIE_NAME}=invalid_user`,
        },
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Get tasks for valid User", async () => {
    const res = await app.request(
      BASE_PATH + listTasks.getRoutingPath(),
      {
        method: "GET",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(200)
    expect((await res.json<unknown[]>()).length).toBe(3)
  })
  test("Try Get task by ID", async () => {
    const res = await app.request(
      BASE_PATH + taskById.getRoutingPath().replace(":id", "task_1"),
      {
        method: "GET",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).not.toBeNull()
  })
  test("Try Get task by invalid ID", async () => {
    const res = await app.request(
      BASE_PATH + taskById.getRoutingPath().replace(":id", "task_12334"),
      {
        method: "GET",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(404)
  })
  test("Try Update task by ID", async () => {
    const res = await app.request(
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "task_1"),
      {
        method: "PUT",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          status: "in_progress",
        }),
      },
      env
    )

    expect(res.status).toBe(200)
    expect((await res.json<Task>()).status).toBe("in_progress")
  })
  test("Try Update task by invalid ID", async () => {
    const res = await app.request(
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "task_999"),
      {
        method: "PUT",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          completed: true,
        }),
      },
      env
    )

    expect(res.status).toBe(404)
  })

  test("Try Delete task by ID", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "task_3"),
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(200)
    expect((await res.json<Task>()).id).toBe("task_3")
  })
  test("Try Delete task by invalid ID", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "task_3333"),
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_2` },
      },
      env
    )

    expect(res.status).toBe(400)
  })
})
