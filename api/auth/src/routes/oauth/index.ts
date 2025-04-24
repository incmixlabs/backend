import type { GoogleUser } from "@/dbSchema"
import { envVars } from "@/env-vars"
import { ACC_DISABLED, VERIFIY_REQ } from "@/lib/constants"

import { insertOAuthUser } from "@/lib/helper"
import { createSession } from "@/lib/lucia"
import { initializeGoogleAuth } from "@/lib/oauth"

import { googleCallback, googleOAuth } from "@/routes/oauth/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_BAD_REQUEST } from "@incmix-api/utils"
import {
  BadRequestError,
  ForbiddenError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { generateCodeVerifier, generateState } from "arctic"
import { getCookie, setCookie } from "hono/cookie"
import type { CookieOptions } from "hono/utils/cookie"

const oAuthRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

oAuthRoutes.openapi(googleOAuth, async (c) => {
  try {
    const clientType = c.req.header("X-Client-Type")
    const google = initializeGoogleAuth(envVars, {
      isTauri: clientType === "desktop",
    })

    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "email",
      "profile",
    ])

    // const options: CookieOptions = {
    //   httpOnly: true,
    //   path: "/",
    //   maxAge: 600,
    //   secure: true,
    //   sameSite: "none",
    // }

    let options = "Max-Age=600; Path=/; HttpOnly; Secure; SameSite=None "

    if (!envVars.DOMAIN.includes("localhost")) {
      options += `; Domain=${envVars.DOMAIN}`
    }

    c.res.headers.append("Set-Cookie", `state=${state}; ${options}`)
    c.res.headers.append(
      "Set-Cookie",
      `code_verifier=${codeVerifier}; ${options}`
    )

    // setCookie(c, "state", state, options)
    // setCookie(c, "code_verifier", codeVerifier, options)

    return c.json({ authUrl: url }, 200)
  } catch (error) {
    return await processError<typeof googleOAuth>(c, error, [
      "{{ default }}",
      "google-oauth",
    ])
  }
})

oAuthRoutes.openapi(googleCallback, async (c) => {
  const stateCookie = getCookie(c, "state")
  const codeVerifierCookie = getCookie(c, "code_verifier")

  const { state, code } = c.req.valid("query")
  const t = await useTranslation(c)

  if (
    !stateCookie ||
    !state ||
    !codeVerifierCookie ||
    !code ||
    stateCookie !== state
  ) {
    const missing = []
    if (!stateCookie) missing.push("stateCookie")
    if (!state) missing.push("state")
    if (!codeVerifierCookie) missing.push("codeVerifierCookie")
    if (!code) missing.push("code")

    const missingMsg = `Missing: ${missing.join(", ")}`

    const msg = `${await t.text(ERROR_BAD_REQUEST)} (${missingMsg})`
    throw new BadRequestError(msg)
  }

  try {
    const clientType = c.req.header("X-Client-Type")
    const google = initializeGoogleAuth(envVars, {
      isTauri: clientType === "desktop",
    })
    const tokens = await google.validateAuthorizationCode(
      code,
      codeVerifierCookie
    )

    const googleUserRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      }
    ).then((res) => res.json() as Promise<GoogleUser>)

    const user = await insertOAuthUser(
      "google",
      {
        email: googleUserRes.email,
        fullName: googleUserRes.name,
        avatar: googleUserRes.picture,
      },
      googleUserRes.sub,
      c
    )

    if (!user.isActive) {
      const msg = await t.text(ACC_DISABLED)
      throw new ForbiddenError(msg)
    }
    if (!user.emailVerified) {
      const msg = await t.text(VERIFIY_REQ)
      throw new ForbiddenError(msg)
    }

    const session = await createSession(c, user.id)
    return c.json(
      {
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        userType: user.userType,
        id: user.id,
        session,
      },
      200
    )
  } catch (error) {
    console.error(error)
    return await processError<typeof googleCallback>(c, error, [
      "{{ default }}",
      "google-oauth-callback",
    ])
  }
})

export default oAuthRoutes
