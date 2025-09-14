import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { createClient } from "redis"
import { envVars } from "../../env-vars"
import { getAddressFromLocation, getLocationFromIp } from "../../lib/helper"
import type { Address } from "../../types"
import {
  type WeatherApiResponse,
  WeatherCodes,
  type WeatherForecast,
} from "./types"

export const setupWeatherRoutes = (app: FastifyInstance) => {
  app.get(
    "/weather",
    {
      schema: {
        description: "Get weather forecast for a location",
        tags: ["weather"],
        querystring: {
          type: "object",
          properties: {
            lat: {
              type: "string",
              description: "Latitude",
              example: "35.4757",
            },
            lon: {
              type: "string",
              description: "Longitude",
              example: "80.5901",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              temperatureUnit: {
                type: "string",
                default: "c",
                example: "c",
              },
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: {
                      type: "string",
                      example: "2023-01-25T21:00:00Z",
                    },
                    temperatureMax: {
                      type: "number",
                      example: 7.63,
                    },
                    temperatureMin: {
                      type: "number",
                      example: -5.19,
                    },
                    temperatureAvg: {
                      type: "number",
                      example: 2.55,
                    },
                    weatherType: {
                      type: "string",
                      example: "Clear",
                    },
                    weatherCode: {
                      type: "number",
                      example: 1000,
                    },
                  },
                },
              },
              location: {
                type: "string",
                example: "New York",
              },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { lat?: string; lon?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { lat, lon } = request.query

        const searchParams = new URLSearchParams({
          units: "metric",
        })

        let address: Address | undefined

        if (!lat || !lon) {
          // Get location from IP if coordinates not provided
          address = await getLocationFromIp(request)
          searchParams.append("location", `${address.lat},${address.lon}`)
        } else {
          // Get address from coordinates
          address = await getAddressFromLocation({ lat, lon })
          searchParams.append("location", `${lat},${lon}`)
        }

        // Redis caching
        let redis: any
        const cacheKey = `weather:${searchParams.toString()}`

        try {
          if (envVars.REDIS_URL) {
            redis = createClient({ url: envVars.REDIS_URL })
            await redis.connect()

            const cache = await redis.get(cacheKey)
            if (cache) {
              console.log("weather:cache hit")
              const data = JSON.parse(cache) as WeatherForecast
              await redis.quit()
              return reply.send(data)
            }
          }
        } catch (redisError) {
          console.warn("Redis error, continuing without cache:", redisError)
        }

        // Fetch weather data from API
        searchParams.append("apikey", envVars.WEATHER_API_KEY)
        const res = await fetch(
          `${envVars.WEATHER_URL}/forecast?${searchParams.toString()}`,
          {
            method: "get",
          }
        )

        if (!res.ok) {
          const errorData = await res.json()
          console.error("Weather API error:", errorData)
          return reply.code(400).send({
            message: errorData.message || "Failed to fetch weather data",
          })
        }

        const weatherForecast = (await res.json()) as WeatherApiResponse

        // Transform the data to match our schema
        const data: WeatherForecast = {
          temperatureUnit: "c",
          days: weatherForecast.timelines.daily.map((day) => ({
            time: day.time,
            temperatureMax: day.values.temperatureMax,
            temperatureMin: day.values.temperatureMin,
            temperatureAvg: day.values.temperatureAvg,
            weatherType: WeatherCodes[day.values.weatherCodeMax] || "Unknown",
            weatherCode: day.values.weatherCodeMax,
          })),
          location:
            address?.city || weatherForecast.location?.name || "Unknown",
        }

        // Cache the result
        if (redis?.isOpen) {
          try {
            const cacheKeyWithoutApiKey = `weather:${searchParams.toString().replace(/apikey=[^&]+/, "")}`
            await redis.setEx(cacheKeyWithoutApiKey, 3600, JSON.stringify(data)) // Cache for 1 hour
            await redis.quit()
          } catch (cacheError) {
            console.warn("Failed to cache weather result:", cacheError)
          }
        }

        return reply.send(data)
      } catch (error) {
        console.error("Error fetching weather forecast:", error)
        return reply.code(500).send({
          message: "Failed to fetch weather forecast",
        })
      }
    }
  )
}
