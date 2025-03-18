import type { Context } from "./types"
import { stream } from "hono/streaming"
export async function returnResponse(res: Response, c: Context) {
  const contentType = res.headers.get("content-type")
  const cookies = res.headers.get("set-cookie")

  if (cookies) {
    c.res.headers.set("set-cookie", cookies)
  }

  if (contentType?.includes("application/json")) {
    return c.json(await res.json())
  }

  if (contentType?.includes("text/html")) {
    return c.html(await res.text())
  }

  if (contentType?.includes("application/octet-stream")) {
    return stream(c, async (stream) => {
      stream.onAbort(() => {
        console.log("Stream aborted")
      })

      return stream.pipe((await res.blob()).stream())
    })
  }

  return c.text(await res.text())
}
