declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {
    AUTH_URL: string
    TODO_URL: string
    USERS_URL: string
    ORG_URL: string
    INTL_URL: string
    FILES_URL: string
    EMAIL_URL: string
  }
}
