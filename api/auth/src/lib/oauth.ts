import { Google } from "arctic"
import type { Context } from "@/types"
import { envVars } from "../env-vars"

type GoogleAuthOptions = {
  isTauri?: boolean
}

export function initializeGoogleAuth(
  _c: Context,
  options: GoogleAuthOptions = {}
) {
  const baseUrl =
    envVars.GOOGLE_REDIRECT_URL ?? `${envVars.FRONTEND_URL}/auth/google`
  const redirectUrl = options.isTauri
    ? `${baseUrl}/tauri-callback`
    : `${baseUrl}/callback`

  return new Google(
    envVars.GOOGLE_CLIENT_ID as string,
    envVars.GOOGLE_CLIENT_SECRET as string,
    redirectUrl
  )
}
