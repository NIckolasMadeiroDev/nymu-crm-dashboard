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
    
    // Usar proxy do Next.js para evitar CORS
    const isClient = typeof window !== 'undefined'
    
    // Build URL - if endpoint already has query string, preserve it
    let url: string
    if (isClient) {
      // Client-side: use proxy
      url = `/api/helena-proxy?endpoint=${encodeURIComponent(cleanEndpoint)}`
    } else {
      // Server-side: build direct URL
      // baseUrl already includes the domain (e.g., https://api.helena.run)
      // cleanEndpoint is like "crm/v1/panel" or "core/v1/contact"
      if (cleanEndpoint.startsWith('crm/v1/') || cleanEndpoint.startsWith('core/v1/')) {
        url = `${this.config.baseUrl}/${cleanEndpoint}`
      } else if (cleanEndpoint.startsWith('crm/')) {
        url = `${this.config.baseUrl}/crm/v1/${cleanEndpoint.replace(/^crm\//, '')}`
      } else {
        url = `${this.config.baseUrl}/${cleanEndpoint}`
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Helena API Client] Making request to:', url)
      console.log('[Helena API Client] Is client:', isClient)
      console.log('[Helena API Client] Endpoint:', cleanEndpoint)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      }

      // Adicionar Authorization apenas no servidor
      if (!isClient) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${this.config.token}`,
          'User-Agent': 'Helena-CRM-Dashboard/1.0',
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Helena API Client] Fetch options:', {
          method: fetchOptions.method || 'GET',
          url,
          isClient,
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

      // Try to parse JSON, but handle non-JSON responses gracefully
      let data: T
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          // If not JSON, try to parse anyway or return empty object
          const text = await response.text()
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            data = JSON.parse(text)
          } else {
            // Non-JSON response - might be HTML error page or plain text
            throw new HelenaApiError(
              `Invalid response format. Expected JSON but got: ${contentType || 'unknown'}. Response: ${text.substring(0, 100)}`,
              response.status,
              'INVALID_RESPONSE'
            )
          }
        }
      } catch (parseError) {
        if (parseError instanceof HelenaApiError) {
          throw parseError
        }
        const text = await response.text().catch(() => 'Unable to read response')
        throw new HelenaApiError(
          `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${text.substring(0, 200)}`,
          response.status,
          'PARSE_ERROR'
        )
      }
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
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        return {
          message: errorData.message || errorData.error || response.statusText,
          code: errorData.code,
        }
      } else {
        // Try to read as text for non-JSON responses
        const text = await response.text()
        // Check if it's HTML error page
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          return {
            message: `HTTP ${response.status}: ${response.statusText} - Server returned HTML error page`,
            code: 'HTML_ERROR',
          }
        }
        // Check if it starts with "ERROR:"
        if (text.trim().startsWith('ERROR:')) {
          return {
            message: text.trim().substring(0, 500),
            code: 'SERVER_ERROR',
          }
        }
        // Return text response (truncated)
        return {
          message: text.substring(0, 500) || response.statusText,
          code: 'TEXT_ERROR',
        }
      }
    } catch (parseError) {
      return {
        message: `HTTP ${response.status}: ${response.statusText} - Failed to parse error response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        code: 'PARSE_ERROR',
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let queryString = ''
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays - API expects multiple parameters with same name
          if (Array.isArray(value)) {
            value.forEach((item) => {
              searchParams.append(key, item.toString())
            })
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })
      queryString = `?${searchParams.toString()}`
    }
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

