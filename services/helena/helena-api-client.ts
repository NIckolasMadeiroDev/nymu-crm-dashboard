import type {
  HelenaApiConfig,
  HelenaApiResponse,
} from '@/types/helena'
import { HelenaApiError } from '@/types/helena'

export class HelenaApiClient {
  private readonly config: HelenaApiConfig
  private readonly defaultTimeout = 30000

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
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
    
    const url = cleanEndpoint.startsWith('crm/')
      ? `${this.config.baseUrl}/crm/v1/${cleanEndpoint.replace(/^crm\//, '')}`
      : `${this.config.baseUrl}/core/v1/${cleanEndpoint}`

    if (process.env.NODE_ENV === 'development') {
      console.log('[Helena API Client] Making request to:', url)
      console.log('[Helena API Client] Full URL:', url)
      console.log('[Helena API Client] Base URL:', this.config.baseUrl)
      console.log('[Helena API Client] Endpoint:', cleanEndpoint)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Helena-CRM-Dashboard/1.0',
          ...options.headers,
        },
        signal: controller.signal,
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Helena API Client] Fetch options:', {
          method: fetchOptions.method || 'GET',
          url,
          hasAuth: !!this.config.token,
          tokenPrefix: this.config.token?.substring(0, 10),
        })
      }

      const response = await fetch(url, fetchOptions)

      if (process.env.NODE_ENV === 'development') {
        console.log('[Helena API Client] Response status:', response.status)
        console.log('[Helena API Client] Response headers:', Object.fromEntries(response.headers.entries()))
      }

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
        
        // Log detalhado do erro em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('[Helena API Client] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            url,
            cause: (error as any).cause,
          })
        }
        
        const errorMessage = error.message.includes('fetch failed') || 
                           error.message.includes('ECONNREFUSED') ||
                           error.message.includes('ENOTFOUND') ||
                           error.message.includes('ECONNRESET')
          ? `Failed to connect to ${url}. Erro: ${error.message}. Verifique se a URL está acessível e se há problemas de rede/firewall.`
          : `Network error: ${error.message}`
        throw new HelenaApiError(
          errorMessage,
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
    const queryString = params && Object.keys(params).length > 0
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

  async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.data) {
      throw new HelenaApiError('No data received from API')
    }

    return response.data
  }
}

