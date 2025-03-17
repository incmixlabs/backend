import type { Context as HonoContext } from "hono"

type EnvVariables = {
  INTL_URL: string
  DOMAIN: string
  WEATHER_URL: string
  WEATHER_API_KEY: string
  LOCATION_URL: string
  LOCATION_API_KEY: string
  SERP_NEWS_URL: string
  SERP_API_KEY: string
  RATE_LIMIT: string
  RATE_LIMIT_PERIOD: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
}

type Services = {}

export type Bindings = EnvVariables & Services

export type Address = {
  name: string
  city: string
  state: string
  country: string
  country_code: string
  lat: string
  lon: string
}

export type Variables = {
  defaultLocation: Address
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
