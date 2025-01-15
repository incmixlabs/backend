import {
  type Miniflare,
  type Request,
  type RequestInitCfType,
  Response,
} from "miniflare"

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
