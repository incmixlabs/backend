import test, { type APIRequestContext, expect } from "@playwright/test"

test.setTimeout(120000)
test.beforeAll(async ({ request }) => {
  test.setTimeout(120000)
  await login(request)
  const presignedUploadRes = await request.get("/api/files/presigned-upload", {
    params: { fileName: "e2e_test_file.txt" },
  })
  expect(presignedUploadRes.status()).toBe(200)
  const { url: uploadUrl } = await presignedUploadRes.json()

  const fileContent = "file content"

  const uploadRes = await request.put(uploadUrl, {
    data: fileContent,
    headers: {
      "Content-Type": "text/plain",
    },
  })

  expect(uploadRes.status()).toBe(200)
})

test("Try downloading file without login", async ({ request }) => {
  const res = await request.get("/api/files/presigned-download", {
    params: { fileName: "e2e_test_file.txt" },
  })
  expect(res.status()).toBe(401)
})

test("Upload file", async ({ request }) => {
  await login(request)
  const presignedUploadRes = await request.get("/api/files/presigned-upload", {
    params: { fileName: "e2e_test_file_2.txt" },
  })
  expect(presignedUploadRes.status()).toBe(200)
  const { url: uploadUrl } = await presignedUploadRes.json()

  const fileContent = "file content"

  const uploadRes = await request.put(uploadUrl, {
    data: fileContent,
    headers: {
      "Content-Type": "text/plain",
    },
  })
  expect(uploadRes.status()).toBe(200)
})

test("Download file", async ({ request }) => {
  await login(request)
  const presignedDownloadRes = await request.get(
    "/api/files/presigned-download",
    {
      params: { fileName: "e2e_test_file.txt" },
    }
  )
  expect(presignedDownloadRes.status()).toBe(200)
  const { url: downloadUrl } = await presignedDownloadRes.json()

  const downloadRes = await request.get(downloadUrl)
  expect(downloadRes.status()).toBe(200)
  expect(await downloadRes.text()).toBe("file content")
})

test("Get presigned URL for upload", async ({ request }) => {
  await login(request)
  const res = await request.get("/api/files/presigned-upload", {
    params: { fileName: "e2e_test_file_3.txt" },
  })
  expect(res.status()).toBe(200)
  const { url } = await res.json()
  expect(typeof url).toBe("string")
})

test("Get presigned URL for download", async ({ request }) => {
  await login(request)
  const res = await request.get("/api/files/presigned-download", {
    params: { fileName: "e2e_test_file.txt" },
  })
  expect(res.status()).toBe(200)
  const { url } = await res.json()
  expect(typeof url).toBe("string")
})

test("Check health status", async ({ request }) => {
  const res = await request.get("/api/files/healthcheck")
  expect(res.status()).toBe(200)
  const { status, bucket } = await res.json()
  expect(status).toBe("UP")
  expect(bucket).toBe("UP")
})

test("Delete file", async ({ request }) => {
  await login(request)

  // First, upload a file to delete
  const presignedUploadRes = await request.get("/api/files/presigned-upload", {
    params: { fileName: "e2e_test_file_to_delete.txt" },
  })
  expect(presignedUploadRes.status()).toBe(200)
  const { url: uploadUrl } = await presignedUploadRes.json()

  const fileContent = "file to delete"

  const uploadRes = await request.put(uploadUrl, {
    data: fileContent,
    headers: {
      "Content-Type": "text/plain",
    },
  })
  expect(uploadRes.status()).toBe(200)

  // Now, delete the file
  const presignedDeleteRes = await request.get("/api/files/presigned-delete", {
    params: { fileName: "e2e_test_file_to_delete.txt" },
  })
  expect(presignedDeleteRes.status()).toBe(200)
  const { url: deleteUrl } = await presignedDeleteRes.json()

  const deleteRes = await request.delete(deleteUrl)
  expect(deleteRes.status()).toBe(204)

  // Attempt to download the deleted file (should fail)
  const presignedDownloadRes = await request.get(
    "/api/files/presigned-download",
    {
      params: { fileName: "e2e_test_file_to_delete.txt" },
    }
  )
  expect(presignedDownloadRes.status()).toBe(200)
  const { url: downloadUrl } = await presignedDownloadRes.json()

  const downloadRes = await request.get(downloadUrl)
  expect(downloadRes.status()).toBe(404)
})

async function login(request: APIRequestContext) {
  const loginRes = await request.post(
    "https://auth-api-dev-prev.uincmix.workers.dev/api/auth/login",
    { data: { email: "test.user1@example.com", password: "1234" } }
  )
  expect(loginRes.status()).toBe(200)
  const cookie = loginRes.headers()["set-cookie"]?.split(";")[0]
  expect(cookie).toBeDefined()
}
