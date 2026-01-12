/**
 * Request Deduplicator
 * 
 * Prevents multiple simultaneous requests to the same endpoint/operation.
 * If a request is already in progress, it returns the existing promise instead
 * of making a new request.
 */
class RequestDeduplicator {
  private readonly inFlightRequests = new Map<string, Promise<any>>()
  private readonly rateLimitDelays = new Map<string, number>()

  /**
   * Executes a request with deduplication.
   * If a request with the same key is already in progress, returns the existing promise.
   * 
   * @param key - Unique key for the request (e.g., 'getAllContacts' or 'getPanelsWithDetails')
   * @param requestFn - Function that returns a Promise for the request
   * @param minDelay - Minimum delay in milliseconds between requests of the same type (default: 1000ms)
   * @returns Promise that resolves when the request completes
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    minDelay: number = 1000
  ): Promise<T> {
    // Check if there's a request already in flight
    const existingRequest = this.inFlightRequests.get(key)
    if (existingRequest) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RequestDeduplicator] Request "${key}" already in progress, reusing promise`)
      }
      return existingRequest
    }

    // Check if we're in a rate limit cooldown period
    const lastRequestTime = this.rateLimitDelays.get(key)
    if (lastRequestTime) {
      const timeSinceLastRequest = Date.now() - lastRequestTime
      if (timeSinceLastRequest < minDelay) {
        const waitTime = minDelay - timeSinceLastRequest
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RequestDeduplicator] Rate limit cooldown for "${key}", waiting ${waitTime}ms`)
        }
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // Create the request promise
    const requestPromise = requestFn()
      .then((result) => {
        // Remove from in-flight requests on success
        this.inFlightRequests.delete(key)
        this.rateLimitDelays.set(key, Date.now())
        return result
      })
      .catch((error) => {
        // Remove from in-flight requests on error
        this.inFlightRequests.delete(key)
        this.rateLimitDelays.set(key, Date.now())
        throw error
      })

    // Store the promise
    this.inFlightRequests.set(key, requestPromise)

    return requestPromise
  }

  /**
   * Clears all in-flight requests (useful for testing or error recovery)
   */
  clear(): void {
    this.inFlightRequests.clear()
  }

  /**
   * Clears rate limit delays (useful for testing)
   */
  clearRateLimitDelays(): void {
    this.rateLimitDelays.clear()
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator()
