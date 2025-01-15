import {
  type Miniflare,
  type Request,
  type RequestInitCfType,
  Response,
} from "miniflare"

const user1 = {
  email: "user1@example.com",
  fullName: "User 1",
  id: "user_1",
  localeId: 1,
}
const user2 = {
  email: "user2@example.com",
  fullName: "User 2",
  id: "user_2",
  localeId: 1,
}

export const authService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready

  const sessionId = req.headers.get("cookie")?.split("=")[1]
  if (!sessionId)
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  if (sessionId === "user_1")
    return Response.json(
      {
        email: "user1@example.com",
        emailVerified: true,
        id: "user_1",
      },
      { status: 200 }
    )
  if (sessionId === "user_2")
    return Response.json(
      {
        email: "user2@example.com",
        emailVerified: true,
        id: "user_2",
      },
      { status: 200 }
    )

  return Response.json({ message: "Unauthorized" }, { status: 401 })
}
export const intlService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready
  const url = new URL(req.url)
  if (url.pathname.endsWith("locales/default"))
    return Response.json({ code: "en", is_default: true }, { status: 200 })

  return Response.json(defaultMessages, { status: 200 })
}

export const usersService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready

  const url = new URL(req.url)
  const sessionId = req.headers.get("cookie")?.split("=")[1]

  if (!sessionId)
    return Response.json({ message: "Unauthorized" }, { status: 401 })

  if (url.pathname.includes("/me")) {
    if (sessionId === "user_1") return Response.json(user1, { status: 200 })
    if (sessionId === "user_2") return Response.json(user2, { status: 200 })

    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  const query = url.searchParams
  const id = query.get("id")
  const email = query.get("email")
  if (id) {
    if (id === "user_1") {
      return Response.json(user1, { status: 200 })
    }
    if (id === "user_2") {
      return Response.json(user2, { status: 200 })
    }
  }
  if (email) {
    if (email === "user1@example.com") {
      return Response.json(user1, { status: 200 })
    }

    if (email === "user2@example.com") {
      return Response.json(user2, { status: 200 })
    }

    return Response.json({ message: "user not found" }, { status: 404 })
  }

  return Response.json({ message: "user not found" }, { status: 404 })
}

export const filesService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready
  const url = new URL(req.url)
  const method = req.method

  if (method === "PUT" && url.pathname.endsWith("/upload")) {
    const fileName = url.searchParams.get("fileName")
    if (!fileName) {
      return Response.json(
        { message: "File name is required" },
        { status: 400 }
      )
    }
    const file = await req.arrayBuffer()

    if (!file) {
      return Response.json({ message: "No file found" }, { status: 400 })
    }

    const cookies = req.headers.get("cookie")
    if (!cookies) {
      return Response.json({ message: "No cookies found" }, { status: 400 })
    }
    const sessionId = req.headers.get("cookie")?.split("=")[1]
    if (!sessionId) {
      return Response.json(
        { message: "UserId not found in cookies" },
        { status: 400 }
      )
    }

    return Response.json({ message: "File uploaded" }, { status: 200 })
  }

  if (method === "DELETE" && url.pathname.endsWith("/delete")) {
    const cookies = req.headers.get("cookie")
    if (!cookies) {
      return Response.json({ message: "No cookies found" }, { status: 400 })
    }
    const sessionId = req.headers.get("cookie")?.split("=")[1]
    if (!sessionId) {
      return Response.json(
        { message: "UserId not found in cookies" },
        { status: 400 }
      )
    }

    return Response.json({ message: "File deleted" }, { status: 200 })
  }

  if (method === "GET" && url.pathname.endsWith("/presigned-upload")) {
    const fileName = url.searchParams.get("fileName")
    if (!fileName) {
      return Response.json(
        { message: "File name is required" },
        { status: 400 }
      )
    }
    const localUrl = `http://127.0.0.1:8282/api/files/upload?fileName=${encodeURIComponent(fileName)}`
    return Response.json({ url: localUrl }, { status: 200 })
  }

  if (method === "GET" && url.pathname.endsWith("/presigned-download")) {
    const fileName = url.searchParams.get("fileName")
    if (!fileName) {
      return Response.json(
        { message: "File name is required" },
        { status: 400 }
      )
    }
    const localUrl = `http://127.0.0.1:8282/api/files/download?fileName=${encodeURIComponent(fileName)}`
    return Response.json({ url: localUrl }, { status: 200 })
  }

  if (method === "GET" && url.pathname.endsWith("/presigned-delete")) {
    const fileName = url.searchParams.get("fileName")
    if (!fileName) {
      return Response.json(
        { message: "File name is required" },
        { status: 400 }
      )
    }
    const localUrl = `http://127.0.0.1:8282/api/files/delete?fileName=${encodeURIComponent(fileName)}`
    return Response.json({ url: localUrl }, { status: 200 })
  }

  return Response.json({ message: "Not found" }, { status: 404 })
}

export const defaultMessages = [
  {
    key: "errors.server_error",
    value: "errors.server_error",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.unauthorized",
    value: "errors.unauthorized",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.bad_request",
    value: "errors.bad_request",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.not_implemented",
    value: "errors.not_implemented",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.filename_req",
    value: "errors.filename_req",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.upload_fail",
    value: "errors.upload_fail",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.file_not_found",
    value: "errors.file_not_found",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.files_list_failed",
    value: "errors.files_list_failed",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.r2_missing",
    value: "errors.r2_missing",
    locale: "en",
    type: "label",
  },
  {
    key: "errors.r2_bucket",
    value: "errors.r2_bucket",
    locale: "en",
    type: "label",
  },
  {
    key: "files.delete_success",
    value: "files.delete_success",
    locale: "en",
    type: "label",
  },
]
