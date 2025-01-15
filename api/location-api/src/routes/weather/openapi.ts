import { createRoute } from "@hono/zod-openapi"
import { MessageResponseSchema } from "../types"
import { LocationSchema, WeatherForecastSchema } from "./types"

export const getWeatherForecast = createRoute({
  path: "/",
  method: "get",
  summary: "Get Weather Forecast",
  description: "Get 5 day weather forecast",
  tags: ["Weather"],
  request: {
    query: LocationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WeatherForecastSchema,
        },
      },
      description: "Returns weather forecast data",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Bad Request",
    },
  },
})
