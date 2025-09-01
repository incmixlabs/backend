import { getConnInfo } from "@hono/node-server/conninfo"
import { envVars } from "@/env-vars"
import type { Address, Context } from "@/types"

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
export const getLocationFromIp = async (c: Context) => {
  const connInfo = getConnInfo(c)
  const userIp = connInfo.remote.address

  const res = await fetch(
    `${envVars.LOCATION_URL}/ipinfo?ip=${userIp}&apiKey=${envVars.LOCATION_API_KEY}`,
    {
      method: "get",
    }
  )

  const address = (await res.json()) as Location

  return {
    name: address.city.name,
    city: address.city.name,
    state: address.state.name,
    country: address.country.name,
    country_code: address.country.iso_code,
    lat: address.location.latitude,
    lon: address.location.longitude,
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
