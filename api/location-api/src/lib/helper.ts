import type { FastifyRequest } from "fastify"
import { envVars } from "../env-vars"
import type { Address } from "../types"

type Location = {
  location: { latitude: string; longitude: string }
  city: {
    name: string
  }
  country: {
    iso_code: string
    name: string
  }
  state: {
    name: string
  }
}
export const getLocationFromIp = async (request: FastifyRequest) => {
  try {
    const userIp = request.ip || "127.0.0.1"

    const res = await fetch(
      `${envVars.LOCATION_URL}/ipinfo?ip=${userIp}&apiKey=${envVars.LOCATION_API_KEY}`,
      {
        method: "get",
      }
    )

    if (!res.ok) {
      console.warn(
        `Location API returned ${res.status}, using default location`
      )
      return {
        name: "San Francisco",
        city: "San Francisco",
        state: "California",
        country: "United States",
        country_code: "US",
        lat: "37.7749",
        lon: "-122.4194",
      }
    }

    const address = (await res.json()) as Location

    // Validate the response has required fields
    if (!address?.city?.name || !address?.country?.iso_code) {
      console.warn("Invalid location response, using default location")
      return {
        name: "San Francisco",
        city: "San Francisco",
        state: "California",
        country: "United States",
        country_code: "US",
        lat: "37.7749",
        lon: "-122.4194",
      }
    }

    return {
      name: address.city.name,
      city: address.city.name,
      state: address.state?.name || "",
      country: address.country.name,
      country_code: address.country.iso_code,
      lat: address.location?.latitude || "0",
      lon: address.location?.longitude || "0",
    }
  } catch (error) {
    console.error("Error getting location from IP:", error)
    // Return default location on error
    return {
      name: "San Francisco",
      city: "San Francisco",
      state: "California",
      country: "United States",
      country_code: "US",
      lat: "37.7749",
      lon: "-122.4194",
    }
  }
}

export const getAddressFromLocation = async (location: {
  lat: string
  lon: string
}) => {
  const searchParams = new URLSearchParams({
    lat: location.lat,
    lon: location.lon,
    apiKey: envVars.LOCATION_API_KEY,
    format: "json",
  })
  const res = await fetch(
    `${envVars.LOCATION_URL}/geocode/reverse?${searchParams.toString()}`,
    {
      method: "get",
    }
  )

  const data = (await res.json()) as { results: Address[] }

  const [address] = data.results

  return address
}

export const fetchWithTimeout = async (
  url: string,
  ms = 8000,
  init?: RequestInit
) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}
