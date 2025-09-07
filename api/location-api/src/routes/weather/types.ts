import { z } from "zod"
export const LocationSchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
})

export const WeatherSchema = z.object({
  time: z.string(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  temperatureAvg: z.number(),
  weatherType: z.string(),
  weatherCode: z.number(),
})

export const WeatherForecastSchema = z.object({
  temperatureUnit: z.string().default("c"),
  days: z.array(WeatherSchema),
  location: z.string().optional(),
})

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
