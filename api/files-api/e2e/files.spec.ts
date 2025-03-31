import test, { type APIRequestContext, expect } from "@playwright/test"

test.setTimeout(120000)

// Helper function to login
async function login(request: APIRequestContext) {
  const loginRes = await request.post(
    "https://auth-api-dev-prev.uincmix.workers.dev/api/auth/login",
    { data: { email: "test.user1@example.com", password: "1234" } }
  )
  expect(loginRes.status()).toBe(200)
  const cookie = loginRes.headers()["set-cookie"]?.split(";")[0]
  expect(cookie).toBeDefined()
  return cookie
}

// File management utilities for tests
async function uploadTestFile(request: APIRequestContext, fileName: string, content = "file content") {
  const presignedUploadRes = await request.get("/api/files/presigned-upload", {
    params: { fileName }
  })
  expect(presignedUploadRes.status()).toBe(200)
  const { url: uploadUrl } = await presignedUploadRes.json()

  const uploadRes = await request.put(uploadUrl, {
    data: content,
    headers: {
      "Content-Type": "text/plain",
    },
  })
  expect(uploadRes.status()).toBe(200)
  return uploadRes
}

async function downloadTestFile(request: APIRequestContext, fileName: string) {
  const presignedDownloadRes = await request.get(
    "/api/files/presigned-download",
    {
      params: { fileName },
    }
  )
  expect(presignedDownloadRes.status()).toBe(200)
  const { url: downloadUrl } = await presignedDownloadRes.json()

  const downloadRes = await request.get(downloadUrl)
  return { downloadRes, downloadUrl }
}

test.describe("Files API", () => {
  let cookie: string | undefined

  test.beforeAll(async ({ request }) => {
    // Login and set up cookie for the test suite
    cookie = await login(request)
    
    // Upload a file that will be used by multiple tests
    await uploadTestFile(request, "suite_test_file.txt", "suite test content")
  })

  test("Authentication requirement - should reject unauthenticated requests", async ({ request }) => {
    // Try to get presigned URL without authentication
    const res = await request.get("/api/files/presigned-upload", {
      params: { fileName: "unauthorized_file.txt" },
    })
    expect(res.status()).toBe(401)
  })

  test("File upload - should generate presigned URL and handle file upload", async ({ request }) => {
    const fileName = "upload_test_file.txt"
    const fileContent = "test file content for upload"
    
    // Get presigned URL
    const presignedRes = await request.get("/api/files/presigned-upload", {
      params: { fileName },
      headers: { cookie: cookie as string }
    })
    expect(presignedRes.status()).toBe(200)
    const { url } = await presignedRes.json()
    expect(typeof url).toBe("string")
    
    // Upload the file using presigned URL
    const uploadRes = await request.put(url, {
      data: fileContent,
      headers: { "Content-Type": "text/plain" }
    })
    expect(uploadRes.status()).toBe(200)
    
    // Verify we can download the file
    const { downloadRes } = await downloadTestFile(request, fileName)
    expect(downloadRes.status()).toBe(200)
    expect(await downloadRes.text()).toBe(fileContent)
  })

  test("File download - should retrieve uploaded file content", async ({ request }) => {
    const fileName = "download_test_file.txt"
    const fileContent = "content for download test"
    
    // Upload a file first
    await uploadTestFile(request, fileName, fileContent)
    
    // Get and use download URL
    const { downloadRes } = await downloadTestFile(request, fileName)
    expect(downloadRes.status()).toBe(200)
    expect(await downloadRes.text()).toBe(fileContent)
  })

  test("File listing - should return list of files", async ({ request }) => {
    // Call the list files endpoint
    const res = await request.get("/api/files/list", {
      headers: { cookie: cookie as string }
    })
    
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.files)).toBe(true)
    
    // Verify our test files are in the list
    const fileNames = data.files.map((f: any) => f.name)
    expect(fileNames).toContain("suite_test_file.txt")
  })

  test("File deletion - should delete file and make it unavailable for download", async ({ request }) => {
    const fileName = "file_to_delete.txt"
    
    // Upload a file first
    await uploadTestFile(request, fileName)
    
    // Get presigned delete URL
    const presignedDeleteRes = await request.get("/api/files/presigned-delete", {
      params: { fileName },
      headers: { cookie: cookie as string }
    })
    expect(presignedDeleteRes.status()).toBe(200)
    const { url: deleteUrl } = await presignedDeleteRes.json()
    
    // Delete the file
    const deleteRes = await request.delete(deleteUrl)
    expect(deleteRes.status()).toBe(204)
    
    // Verify the file is no longer available
    const { downloadRes } = await downloadTestFile(request, fileName)
    expect(downloadRes.status()).toBe(404)
  })

  test("Health check - should return service status", async ({ request }) => {
    const res = await request.get("/api/files/healthcheck")
    expect(res.status()).toBe(200)
    
    const { status, bucket } = await res.json()
    expect(status).toBe("UP")
    expect(bucket).toBe("UP")
  })

  test("Error handling - should return appropriate error for non-existent file", async ({ request }) => {
    const { downloadRes } = await downloadTestFile(request, "nonexistent_file.txt")
    expect(downloadRes.status()).toBe(404)
  })
})