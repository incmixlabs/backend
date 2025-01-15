import test, { expect } from "@playwright/test"

test.setTimeout(120000)
test.beforeAll(async ({ request }) => {
  test.setTimeout(120000)
  const res = await request.post("/api/auth/signup", {
    data: {
      email: "test.user1@example.com",
      password: "1234",
      fullName: "Test User",
    },
  })

  expect([201, 409]).toContain(res.status())
})

test("Sign in using wrong credentials", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: {
      email: "wrong.user@example.com",
      password: "wrong_password",
    },
  })

  expect(res.status()).toBe(401)
})

test("Sign in using test User", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: {
      email: "test.user1@example.com",
      password: "1234",
    },
  })

  expect(res.status()).toBe(200)

  const data = await res.json()
  expect(data.email).toBe("test.user1@example.com")
})

// TODO: find a way to enable email verification in tests
// Disabled due to Email verifiaction restriction on login
// test("Delete user", async ({ request }) => {
//   const res = await request.post("/api/auth/signup", {
//     data: {
//       email: "test.user2@example.com",
//       password: "1234",
//       fullName: "playwright user",
//     },
//   })
//   expect([201, 409]).toContain(res.status())
//   const loginRes = await request.post("/api/auth/login", {
//     data: {
//       email: "test.user2@example.com",
//       password: "1234",
//     },
//   })
//   expect(loginRes.status()).toBe(200)
//   const deleteRes = await request.delete("/api/auth/delete", {
//     data: {
//       email: "test.user2@example.com",
//     },
//   })
//   expect(deleteRes.status()).toBe(200)
//   const reLoginRes = await request.post("/api/auth/login", {
//     data: {
//       email: "test.user2@example.com",
//       password: "1234",
//     },
//   })
//   expect(reLoginRes.status()).toBe(401)
// })

// test("Signup and email verification", async ({ request, page }) => {
//   test.setTimeout(600000)
//   const apiKey = process.env["MAILSURP_KEY"] as string
//   expect(apiKey).toBeDefined()

//   const mailslurp = new MailSlurp({ apiKey })

//   const { id, emailAddress } = await mailslurp.createInbox()

//   const res = await request.post("/api/auth/signup", {
//     data: {
//       email: emailAddress,
//       password: "1234",
//       fullName: "playwright user",
//     },
//   })

//   const cookie = res.headers()["set-cookie"]?.split(";")[0]

//   expect(cookie).toBeDefined()
//   const email = await mailslurp.waitForLatestEmail(id)

//   await page.setContent(email.body as string)
//   const link = (await page.getAttribute("a", "href")) as string
//   expect(link).not.toBeNull()
//   const verifyEmailRes = await request.get(link)
//   expect(verifyEmailRes.status()).toBe(200)
//   await mailslurp.deleteInbox(id)
// })
