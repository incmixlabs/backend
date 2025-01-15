import { z } from "@hono/zod-openapi"
export const LocationSchema = z
  .object({
    lat: z.string().optional().openapi({ example: "35.4757" }),
    lon: z.string().optional().openapi({ example: "80.5901" }),
  })
  .openapi("Location Schema")

export const WeatherSchema = z
  .object({
    time: z.string().openapi({ example: "2023-01-25T21:00:00Z" }),
    temperatureMax: z.number().openapi({ example: 7.63 }),
    temperatureMin: z.number().openapi({ example: -5.19 }),
    temperatureAvg: z.number().openapi({ example: 2.55 }),
    weatherType: z.string().openapi({ example: "Clear" }),
    weatherCode: z.number().openapi({ example: 1000 }),
  })
  .openapi("Weather Schema")

export const WeatherForecastSchema = z
  .object({
    temperatureUnit: z.string().default("c").openapi({ example: "c" }),
    days: z.array(WeatherSchema),
    location: z.string().optional().openapi({ example: "NEWYORK" }),
  })
  .openapi("Weather Forecast Schema")

export type WeatherForecast = z.infer<typeof WeatherForecastSchema>

export type WeatherApiResponse = {
  timelines: {
    daily: {
      time: string
      values: {
        temperatureAvg: number
        temperatureMax: number
        temperatureMin: number
        weatherCodeMax: number
      }
    }[]
  }
  location: {
    lat: number
    lon: number
    name?: string
  }
}

export const WeatherCodes: Record<number, string> = {
  0: "Unknown",
  1000: "Clear",
  1100: "Mostly Clear",
  1101: "Partly Cloudy",
  1102: "Mostly Cloudy",
  1001: "Cloudy",
  2000: "Fog",
  2100: "Light Fog",
  4000: "Drizzle",
  4001: "Rain",
  4200: "Light Rain",
  4201: "Heavy Rain",
  5000: "Snow",
  5001: "Flurries",
  5100: "Light Snow",
  5101: "Heavy Snow",
  6000: "Freezing Drizzle",
  6001: "Freezing Rain",
  6200: "Light Freezing Rain",
  6201: "Heavy Freezing Rain",
  7000: "Ice Pellets",
  7101: "Heavy Ice Pellets",
  7102: "Light Ice Pellets",
  8000: "Thunderstorm",
}
