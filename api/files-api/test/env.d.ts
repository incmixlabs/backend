declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {
    COOKIE_NAME: string
    MY_BUCKET: R2Bucket
    PORT: number
  }
}
