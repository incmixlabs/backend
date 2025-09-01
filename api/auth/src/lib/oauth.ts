import type { Context } from "@/types"
import { Google } from "arctic"
import { env } from "hono/adapter"

type GoogleAuthOptions = {
  isTauri?: boolean
}

export function initializeGoogleAuth(
  c: Context,
  options: GoogleAuthOptions = {}
) {
  const baseUrl =
    env(c).GOOGLE_REDIRECT_URL || `${env(c).FRONTEND_URL}/auth/google`
  const redirectUrl = options.isTauri
    ? `${baseUrl}/tauri-callback`
    : `${baseUrl}/callback`

  return new Google(
    env(c).GOOGLE_CLIENT_ID,
    env(c).GOOGLE_CLIENT_SECRET,
    redirectUrl
  )
}
