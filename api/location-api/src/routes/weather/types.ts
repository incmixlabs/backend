// TODO: Implement weather types
// These are placeholder types that need proper implementation

export type WeatherApiResponse = {
  temperature: number
  humidity: number
  condition: string
  timelines: {
    daily: Array<{
      time: string
      values: {
        temperatureMax: number
        temperatureMin: number
        temperatureAvg: number
        [key: string]: any
      }
    }>
  }
  location: {
    lat: number
    lon: number
    name?: string
  }
}

export type WeatherForecast = {
  temperatureUnit: string
  days: Array<{
    time: any
    temperatureMax: any
    temperatureMin: any
    temperatureAvg: any
    weatherType: any
    weatherCode: any
  }>
  location: string
}

export const WeatherCodes: Record<string, any> = {
  CLEAR: 0,
  CLOUDY: 1,
  RAINY: 2,
  STORMY: 3,
}
