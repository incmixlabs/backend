import { envVars } from "@/env-vars"
import { getAddressFromLocation, getLocationFromIp } from "@/lib/helper"
import type { Address, HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { env } from "hono/adapter"
import { getWeatherForecast } from "./openapi"
import {
  type WeatherApiResponse,
  WeatherCodes,
  type WeatherForecast,
} from "./types"

const weatherRoutes = new OpenAPIHono<HonoApp>()

weatherRoutes.openapi(getWeatherForecast, async (c) => {
  const { lat, lon } = c.req.valid("query")

  const searchParams = new URLSearchParams({
    units: "metric",
  })

  let address: Address | undefined

  if (!lat || !lon) {
    address = await getLocationFromIp(c)
    searchParams.append("location", `${address.lat},${address.lon}`)
  } else {
    address = await getAddressFromLocation({ lat, lon })
    searchParams.append("location", `${lat},${lon}`)
  }

  const redis = c.get("redis")
  const key = searchParams.toString()
  const cache = await redis.get(key)
  if (cache) {
    console.log("weather:cache hit")
    const data = JSON.parse(cache) as WeatherForecast
    return c.json(data, 200)
  }

  searchParams.append("apikey", env(c).WEATHER_API_KEY)
  const res = await fetch(
    `${env(c).WEATHER_URL}/forecast?${searchParams.toString()}`,
    {
      method: "get",
    }
  )

  const weatherForecast = (await res.json()) as WeatherApiResponse
  const data = {
    temperatureUnit: "c",
    days: weatherForecast.timelines.daily.map((day) => ({
      time: day.time,
      temperatureAvg: day.values.temperatureAvg,
      temperatureMax: day.values.temperatureMax,
      temperatureMin: day.values.temperatureMin,
      weatherCode: day.values.weatherCodeMax,
      weatherType: WeatherCodes[day.values.weatherCodeMax] ?? "Unknown",
    })),
    location: address?.city ?? address?.state ?? address?.country,
  }

  // // Expires 1 day
  await redis.set(key, JSON.stringify(data), {
    EX: 60 * 60 * 24,
  })
  console.log("weather:cache miss")
  return c.json(data, 200)
})

export default weatherRoutes
