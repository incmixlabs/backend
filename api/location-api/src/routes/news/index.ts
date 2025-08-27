import { OpenAPIHono } from "@hono/zod-openapi"
import { zodError } from "@incmix-api/utils/errors"
import { env } from "hono/adapter"
import { getLocationFromIp } from "@/lib/helper"
import type { HonoApp } from "@/types"
import { getNews, getNewsTopics } from "./openapi"
import type { NewsApiResponse, NewsResponse, TopicApiResponse } from "./types"

const newsRoutes = new OpenAPIHono<HonoApp>({ defaultHook: zodError })

newsRoutes.openapi(getNewsTopics, async (c) => {
  const { country } = c.req.valid("query")

  const searchParams = new URLSearchParams({
    engine: "google_news",
    hl: "en",
  })

  if (country) {
    searchParams.append("gl", country)
  } else {
    const { country_code } = await getLocationFromIp(c)
    searchParams.append("gl", country_code)
  }

  const redis = c.get("redis")

  const key = searchParams.toString()
  const cache = await redis.get(key)

  if (cache) {
    console.log("news:cache hit")
    const parsedCache = JSON.parse(cache) as TopicApiResponse[]

    return c.json(
      {
        topics: parsedCache,
        country: searchParams.get("gl") ?? "us",
      },
      200
    )
  }
  searchParams.append("api_key", env(c).SERP_API_KEY)
  const res = await fetch(`${env(c).SERP_NEWS_URL}?${searchParams.toString()}`)
  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    return c.json({ message: error }, 400)
  }

  const data = (await res.json()) as { menu_links: TopicApiResponse[] }
  // Expire after one day
  await redis.set(key, JSON.stringify(data.menu_links), {
    EX: 60 * 60 * 24,
  })

  console.log("news:cache miss")
  return c.json(
    { topics: data.menu_links, country: searchParams.get("gl") ?? "us" },
    200
  )
})

newsRoutes.openapi(getNews, async (c) => {
  const { topicToken, country } = c.req.valid("query")
  const searchParams = new URLSearchParams({
    topic_token: topicToken,
    engine: "google_news",
    hl: "en",
  })

  if (country) {
    searchParams.append("gl", country)
  } else {
    const { country_code } = await getLocationFromIp(c)
    searchParams.append("gl", country_code)
  }

  const redis = c.get("redis")

  const key = searchParams.toString()
  const cache = await redis.get(key)

  if (cache) {
    console.log("news:cache hit")
    const parsedCache = JSON.parse(cache as string) as NewsResponse
    return c.json(parsedCache, 200)
  }
  searchParams.append("api_key", env(c).SERP_API_KEY)

  const res = await fetch(`${env(c).SERP_NEWS_URL}?${searchParams.toString()}`)
  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    return c.json({ message: error }, 400)
  }

  const news = (await res.json()) as NewsApiResponse
  const parsed = parseNewsResults(news)
  // Expire after 15 mins
  await redis.set(key, JSON.stringify(parsed), {
    EX: 60 * 15,
  })

  console.log("news:cache miss")
  return c.json(parsed, 200)
})

function parseNewsResults(news: NewsApiResponse): NewsResponse {
  return news.news_results.map((n) => {
    if (!n.highlight)
      return {
        position: n.position,
        highlight: {
          title: n.title,
          thumbnail: n.thumbnail,
          date: n.date,
          link: n.link,
          source: n.source,
        },
        stories: n.stories,
      }
    return {
      position: n.position,
      highlight: n.highlight,
      stories: n.stories,
    }
  })
}

export default newsRoutes
