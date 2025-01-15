declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {
    COOKIE_NAME: string
    TEST_MIGRATIONS: D1Migration[] // Defined in `vitest.config.mts`
    DB: D1Database
  }
}
