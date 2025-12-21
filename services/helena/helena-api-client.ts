import type {
  HelenaApiConfig,
  HelenaApiResponse,
} from '@/types/helena'

export class HelenaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'HelenaApiError'
  }
}

export class HelenaApiClient {
  private config: HelenaApiConfig
  private defaultTimeout = 30000

  constructor(config: HelenaApiConfig) {
    if (!config.baseUrl) {
      throw new Error('Helena API base URL is required')
    }
    if (!config.token) {
      throw new Error('Helena API token is required')
    }

    this.config = {
      ...config,
      timeout: config.timeout || this.defaultTimeout,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<HelenaApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response)
        throw new HelenaApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        )
      }

      const data: T = await response.json()
      return {
        data,
        success: true,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof HelenaApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HelenaApiError('Request timeout', 408, 'TIMEOUT')
        }
        throw new HelenaApiError(
          `Network error: ${error.message}`,
          undefined,
          'NETWORK_ERROR'
        )
      }

      throw new HelenaApiError('Unknown error occurred', undefined, 'UNKNOWN')
    }
  }

  private async parseErrorResponse(response: Response): Promise<{
    message: string
    code?: string
  }> {
    try {
      const errorData = await response.json()
      return {
        message: errorData.message || errorData.error || response.statusText,
        code: errorData.code,
      }
    } catch {
      return {
        message: response.statusText,
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : ''
    const fullEndpoint = `${endpoint}${queryString}`

    const response = await this.request<T>(fullEndpoint, {
      method: 'GET',
    })

    if (!response.data) {
      throw new HelenaApiError('No data received from API')
    }

    return response.data
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.data) {
      throw new HelenaApiError('No data received from API')
    }

    return response.data
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.data) {
      throw new HelenaApiError('No data received from API')
    }

    return response.data
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
    })

    if (!response.data) {
      throw new HelenaApiError('No data received from API')
    }

    return response.data
  }
}

