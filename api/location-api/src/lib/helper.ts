import type { Address, Context } from "@/types"
import { getConnInfo } from "hono/cloudflare-workers"

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
    `${c.env.LOCATION_URL}/ipinfo?ip=${userIp}&apiKey=${c.env.LOCATION_API_KEY}`,
    {
      method: "get",
    }
  )

  const address = await res.json<Location>()

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

export const getAddressFromLocation = async (
  c: Context,
  location: { lat: string; lon: string }
) => {
  const searchParams = new URLSearchParams({
    lat: location.lat,
    lon: location.lon,
    apiKey: c.env.LOCATION_API_KEY,
    format: "json",
  })
  const res = await fetch(
    `${c.env.LOCATION_URL}/geocode/reverse?${searchParams.toString()}`,
    {
      method: "get",
    }
  )

  const data = await res.json<{ results: Address[] }>()

  const [address] = data.results

  return address
}
