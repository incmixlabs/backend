import { stream } from "hono/streaming"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import type { Context } from "./types"

export async function returnResponse(res: Response, c: Context) {
  const contentType = res.headers.get("content-type")
  const cookies = res.headers.getSetCookie()
  const status = res.status as ContentfulStatusCode

  cookies.forEach((cookie) => {
    c.res.headers.append("set-cookie", cookie)
  })

  if (contentType?.includes("application/json")) {
    return c.json(await res.json(), status)
  }

  if (contentType?.includes("text/html")) {
    return c.html(await res.text(), status)
  }

  if (contentType?.includes("application/octet-stream")) {
    return stream(c, async (stream) => {
      stream.onAbort(() => {
        console.log("Stream aborted")
      })

      return stream.pipe((await res.blob()).stream())
    })
  }

  return c.text(await res.text(), status)
}
