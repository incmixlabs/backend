declare module "hono" {
  interface ContextVariableMap {
    kv: KVStore
  }
}

type CacheItem = {
  data: AnyType
  expiresAt: Date
  // Time to live in secs
  ttl: number
}

type AnyType = string | number | boolean | object

export class KVStore {
  private items: Map<string, CacheItem> = new Map<string, CacheItem>()
  private defaultTtl = 300
  constructor(initialItems?: Record<string, AnyType>, ttl?: number) {
    if (ttl) this.defaultTtl = ttl
    if (initialItems) {
      this.items = new Map<string, CacheItem>()
      for (const item of Object.entries(initialItems)) {
        const [k, v] = item
        this.setItem(k, v, this.defaultTtl)
      }
    }
  }

  has(key: string) {
    return this.items.has(key)
  }
  async getItem<T = AnyType>(
    key: string,
    fetchOptions?: { fn: () => Promise<AnyType>; ttl?: number }
  ) {
    const item = this.items.get(key)

    if (!item) {
      if (fetchOptions) {
        return (await this.fetchLatest(key, fetchOptions.fn, fetchOptions.ttl))
          .data as T
      }
      throw new Error(`Key: '${key}' is not defined`)
    }
    if (this.isExpired(key)) {
      if (fetchOptions) {
        return (await this.fetchLatest(key, fetchOptions.fn, item.ttl))
          .data as T
      }
    }
    return item.data as T
  }

  async fetchLatest(
    key: string,
    fetchFn: () => Promise<AnyType>,
    ttl?: number
  ) {
    const newItem = await fetchFn()
    return this.setItem(key, newItem, ttl)
  }

  setItem(key: string, value: AnyType, ttl?: number) {
    const now = new Date()
    now.setSeconds(now.getSeconds() + (ttl ?? this.defaultTtl))
    const cacheItem: CacheItem = {
      data: value,
      ttl: ttl ?? this.defaultTtl,
      expiresAt: now,
    }
    this.items.set(key, cacheItem)

    return cacheItem
  }

  isExpired(key: string) {
    const item = this.items.get(key)
    if (!item) throw new Error(`Key: '${key}' is not defined`)
    const now = Date.now()
    return now >= item.expiresAt.getTime()
  }
}
