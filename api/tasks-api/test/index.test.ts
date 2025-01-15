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
import { defaultHeaders, insertTask } from "@/test/test-utils"
import { beforeAll, describe, expect, test } from "vitest"

describe("Todo worker tests", () => {
  beforeAll(async () => {
    await insertTask(env.DB, {
      task: "task 1",
      userId: "user_1",
      completed: false,
    })
    await insertTask(env.DB, {
      task: "task 2",
      userId: "user_1",
      completed: true,
    })
    await insertTask(env.DB, {
      task: "task 3",
      userId: "user_2",
      completed: true,
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
      BASE_PATH + taskById.getRoutingPath().replace(":id", "1"),
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
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "1"),
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
          task: "task 5",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })
  test("Try Delete task for Unauthorized User", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "1"),
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
    expect((await res.json<unknown[]>()).length).toBe(2)
  })
  test("Try Get task by ID", async () => {
    const res = await app.request(
      BASE_PATH + taskById.getRoutingPath().replace(":id", "1"),
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
      BASE_PATH + taskById.getRoutingPath().replace(":id", "999"),
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
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "1"),
      {
        method: "PUT",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          completed: true,
        }),
      },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({
      id: 1,
      task: "task 1",
      userId: "user_1",
      completed: true,
    })
  })
  test("Try Update task by invalid ID", async () => {
    const res = await app.request(
      BASE_PATH + updateTask.getRoutingPath().replace(":id", "999"),
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

  test("Try Create new Task", async () => {
    const res = await app.request(
      BASE_PATH + createTask.getRoutingPath(),
      {
        method: "POST",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          task: "task 4",
        }),
      },
      env
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toStrictEqual({
      id: 4,
      task: "task 4",
      userId: "user_1",
      completed: false,
    })
  })

  test("Try Delete task by ID", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "3"),
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_2` },
      },
      env
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toStrictEqual({
      id: 3,
      task: "task 3",
      userId: "user_2",
      completed: true,
    })
  })
  test("Try Delete task by invalid ID", async () => {
    const res = await app.request(
      BASE_PATH + deleteTask.getRoutingPath().replace(":id", "3333"),
      {
        method: "DELETE",
        headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_2` },
      },
      env
    )

    expect(res.status).toBe(400)
  })
})
