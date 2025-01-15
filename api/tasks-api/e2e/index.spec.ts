import type { Column, Organization, Project, Task } from "@incmix/shared/types"
import test, { type APIRequestContext, expect } from "@playwright/test"
test.setTimeout(120000)
let TASKID = "1"
test.beforeAll(async ({ request }) => {
  test.setTimeout(120000)

  TASKID = (await setupDatabase(request)).id
})

test("Try Get all tasks without login", async ({ request }) => {
  const res = await request.get("/api/tasks")
  expect(res.status()).toBe(401)
})

test("Get all tasks", async ({ request }) => {
  await login(request)
  const res = await request.get("/api/tasks")
  expect(res.status()).toBe(200)
  expect((await res.json()).length).toBeGreaterThan(0)
})

test("Get Task by ID", async ({ request }) => {
  await login(request)
  const res = await request.get(`/api/tasks/id/${TASKID}`)
  expect(res.status()).toBe(200)
  expect((await res.json()).id).toBe(TASKID)
})
test("Get Task by wrong ID", async ({ request }) => {
  await login(request)
  const res = await request.get("/api/tasks/id/12345")
  expect(res.status()).toBe(404)
})
test("Delete Task by ID", async ({ request }) => {
  await login(request)
  const res = await request.delete(`/api/tasks/${TASKID}`)
  expect(res.status()).toBe(200)
  expect((await res.json()).id).toBe(TASKID)
})

async function login(request: APIRequestContext) {
  const loginRes = await request.post(
    "https://auth-api-dev-prev.uincmix.workers.dev/api/auth/login",
    { data: { email: "test.user1@example.com", password: "1234" } }
  )
  expect(loginRes.status()).toBe(200)
  const cookie = loginRes.headers()["set-cookie"]?.split(";")[0]
  expect(cookie).toBeDefined()

  return (await loginRes.json()) as { id: string }
}

async function setupDatabase(request: APIRequestContext) {
  const user = await login(request)
  const orgRes = await request.post(
    "https://org-api-dev-prev.uincmix.workers.dev/api/org",
    {
      data: {
        name: "Test Organisation",
        handle: "test-organisation",
        members: [],
      },
    }
  )

  expect([201, 409]).toContain(orgRes.status())

  let org: Organization = await orgRes.json()
  if (orgRes.status() === 409) {
    const getOrgRes = await request.get(
      "https://org-api-dev-prev.uincmix.workers.dev/api/org/handle/test-organisation"
    )

    expect(getOrgRes.status()).toBe(200)
    org = await getOrgRes.json()
  }

  const projectRes = await request.post("/api/tasks/projects", {
    data: {
      name: "Test Project",
      orgId: org.id,
    },
  })

  expect([201, 409]).toContain(projectRes.status())
  let project: Project = await projectRes.json()
  if (projectRes.status() === 409) {
    const getProjectRes = await request.get(`/api/tasks/projects/id/${org.id}`)
    expect(getProjectRes.status()).toBe(200)
    const list: Project[] = await getProjectRes.json()
    expect(list.length).toBeGreaterThan(0)
    if (list[0]) project = list[0]
  }

  const columnRes = await request.post("/api/tasks/projects/columns", {
    data: {
      label: "Test Column",
      projectId: project.id,
      columnOrder: 1,
    },
  })

  expect([201, 409]).toContain(columnRes.status())
  let column: Column = await columnRes.json()
  if (columnRes.status() === 409) {
    const getColumnsRes = await request.get(
      `/api/tasks/projects/columns/${project.id}`
    )
    expect(getColumnsRes.status()).toBe(200)
    const list: Column[] = await getColumnsRes.json()
    expect(list.length).toBeGreaterThan(0)
    if (list[0]) column = list[0]
  }

  const res = await request.post("/api/tasks", {
    data: {
      content: "Test Task 1",
      projectId: project.id,
      columnId: column.id,
      taskOrder: 1,
      assignedTo: user.id,
      status: "todo",
    },
  })

  expect(res.status()).toBe(201)

  return (await res.json()) as Task
}
