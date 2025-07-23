import { envVars } from "@/env-vars"
import { getLocationFromIp } from "@/lib/helper"

import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { zodError } from "@incmix-api/utils/errors"
import { getNews, getNewsTopics } from "./openapi"
import type { NewsApiResponse, NewsResponse, TopicApiResponse } from "./types"

const newsRoutes = new OpenAPIHono<HonoApp>({ defaultHook: zodError })

newsRoutes.openapi(getNewsTopics, async (c) => {
  const { country } = c.req.valid("query")

  const searchParams = new URLSearchParams({
    api_key: envVars.SERP_API_KEY,
    engine: "google_news",
    hl: "en",
  })

  if (country) {
    searchParams.append("gl", country)
  } else {
    const { country_code } = await getLocationFromIp(c)
    searchParams.append("gl", country_code)
  }

  // const redis = c.get("redis")

  // const cache = await redis.get<{ menu_links: TopicApiResponse[] }>(
  //   searchParams.toString()
  // )

  // if (cache) {
  //   console.log("news:cache hit")
  //   return c.json(
  //     { topics: cache.menu_links, country: searchParams.get("gl") ?? "us" },
  //     200
  //   )
  // }

  const res = await fetch(`${envVars.SERP_NEWS_URL}?${searchParams.toString()}`)
  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    return c.json({ message: error }, 400)
  }

  const data = (await res.json()) as { menu_links: TopicApiResponse[] }
  // Expire after one day
  // await redis.setex(searchParams.toString(), 60 * 60 * 24, data)

  // console.log("news:cache miss")
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
    api_key: envVars.SERP_API_KEY,
  })

  if (country) {
    searchParams.append("gl", country)
  } else {
    const { country_code } = await getLocationFromIp(c)
    searchParams.append("gl", country_code)
  }

  // const redis = c.get("redis")

  // const cache = await redis.get<NewsResponse>(searchParams.toString())

  // if (cache) {
  //   console.log("news:cache hit")
  //   return c.json(cache, 200)
  // }

  const res = await fetch(`${envVars.SERP_NEWS_URL}?${searchParams.toString()}`)
  if (!res.ok) {
    const { error } = (await res.json()) as { error: string }
    return c.json({ message: error }, 400)
  }

  const news = (await res.json()) as NewsApiResponse
  const parsed = parseNewsResults(news)
  // Expire after 15 mins
  // await redis.setex(searchParams.toString(), 60 * 15, parsed)

  // console.log("news:cache miss")
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
