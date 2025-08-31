import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createReferenceEndpointCheck } from '@incmix-api/utils'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock context
const mockContext = {
  req: {
    url: 'http://localhost:3001/api/auth/health-check'
  }
}

describe('Health Check Reference Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true when reference endpoint is accessible', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200
    })

    const check = createReferenceEndpointCheck('/api/auth')
    const result = await check(mockContext as any)

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/reference',
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('should return false when reference endpoint is not accessible', async () => {
    // Mock failed response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const check = createReferenceEndpointCheck('/api/auth')
    const result = await check(mockContext as any)

    expect(result).toBe(false)
  })

  it('should return false when fetch throws an error', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const check = createReferenceEndpointCheck('/api/auth')
    const result = await check(mockContext as any)

    expect(result).toBe(false)
  })

  it('should handle basePath with trailing slash', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200
    })

    const check = createReferenceEndpointCheck('/api/auth/')
    await check(mockContext as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/reference',
      expect.any(Object)
    )
  })

  it('should handle basePath without leading slash', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200
    })

    const check = createReferenceEndpointCheck('api/auth')
    await check(mockContext as any)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/reference',
      expect.any(Object)
    )
  })

  it('should timeout after the specified time', async () => {
    // Mock a hanging request
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))

    const check = createReferenceEndpointCheck('/api/auth')
    const resultPromise = check(mockContext as any)

    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(10000)

    const result = await resultPromise
    expect(result).toBe(false)
  })
})