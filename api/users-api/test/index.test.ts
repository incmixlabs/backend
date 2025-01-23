import { env } from "cloudflare:test"
import app from "@"
import { BASE_PATH } from "@/lib/constants"
import {
  addProfilePicture,
  createUserProfile,
  deleteProfilePicture,
  updateUser,
} from "@/routes/users/openapi"
import { defaultHeaders, insertUser } from "@/test/test-utils"
import type { UserProfile } from "@incmix/utils/types"
import { beforeAll, describe, expect, test } from "vitest"

const jsonDefaultHeaders = {
  ...defaultHeaders,
  "content-type": "application/json",
}

describe("Users API tests", () => {
  beforeAll(async () => {
    await insertUser(env.DB, {
      email: "user1@gmail.com",
      fullName: "user 1",
      id: "user_1",
      localeId: 1,
      profileImage: null,
      avatar: null,
    })
    await insertUser(env.DB, {
      email: "user2@gmail.com",
      fullName: "user 2",
      id: "user_2",
      localeId: 1,
      profileImage: null,
      avatar: null,
    })
    await insertUser(env.DB, {
      email: "user3@gmail.com",
      fullName: "user 3",
      id: "user_3",
      localeId: 1,
      profileImage: null,
      avatar: null,
    })

    return async () => {
      await env.DB.exec("delete from user_profiles")
    }
  })
  test("create user", async () => {
    const user: UserProfile = {
      email: "user1@gmail.com",
      fullName: "user 1",
      id: "user_1",
      localeId: 1,
      profileImage: null,
      avatar: null,
    }

    const res = await app.request(
      `${BASE_PATH}${createUserProfile.getRoutingPath()}`,
      {
        method: "POST",
        headers: jsonDefaultHeaders,
        body: JSON.stringify(user),
      },
      env
    )

    expect(res.status).toBe(201)
  })

  test("update user without auth", async () => {
    const res = await app.request(
      `${BASE_PATH}${updateUser.getRoutingPath().replace(":id", "user_1")}`,
      {
        method: "PUT",
        headers: jsonDefaultHeaders,
        body: JSON.stringify({
          fullName: "Updated Name",
        }),
      },
      env
    )

    expect(res.status).toBe(401)
  })

  test("update user with auth", async () => {
    const updateRes = await app.request(
      `${BASE_PATH}${updateUser.getRoutingPath().replace(":id", "user_1")}`,
      {
        method: "PUT",
        headers: { ...jsonDefaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        body: JSON.stringify({
          fullName: "Updated Name",
        }),
      },
      env
    )

    expect(updateRes.status).toBe(200)
    const updatedUser = await updateRes.json<UserProfile>()
    expect(updatedUser.fullName).toEqual("Updated Name")
  })

  test("add profile picture", async () => {
    const file = new Blob(["test image content"], { type: "image/jpeg" })
    const formData = new FormData()
    formData.append("file", file, "test.jpg")

    const res = await app.request(
      `${BASE_PATH}${addProfilePicture
        .getRoutingPath()
        .replace(":id", "user_1")}`,
      {
        method: "PUT",
        headers: {
          ...defaultHeaders,
          cookie: `${env.COOKIE_NAME}=user_1`,
        },
        body: formData,
      },
      env
    )

    expect(res.status).toBe(200)
    const user = await res.json<UserProfile>()
    expect(user.profileImage).toEqual("profile_image/user_1.jpg")
  })

  test("delete profile picture", async () => {
    const file = new Blob(["test image content"], { type: "image/jpeg" })
    const formData = new FormData()
    formData.append("file", file, "test.jpg")

    const uploadRes = await app.request(
      `${BASE_PATH}${addProfilePicture
        .getRoutingPath()
        .replace(":id", "user_1")}`,
      {
        method: "PUT",
        headers: {
          ...defaultHeaders,
          cookie: `${env.COOKIE_NAME}=user_1`,
        },
        body: formData,
      },
      env
    )

    expect(uploadRes.status).toBe(200)
    const user = await uploadRes.json<UserProfile>()
    expect(user.profileImage).toEqual("profile_image/user_1.jpg")

    // Delete the profile picture
    const res = await app.request(
      `${BASE_PATH}${deleteProfilePicture
        .getRoutingPath()
        .replace(":id", "user_1")}`,
      {
        method: "DELETE",
        headers: { ...jsonDefaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
      },
      env
    )

    expect(res.status).toBe(200)
    const updatedUser = await res.json<UserProfile>()
    expect(updatedUser.profileImage).toBe(null)
  })
})
