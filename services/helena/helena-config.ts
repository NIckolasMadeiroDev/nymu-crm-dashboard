import type { HelenaApiConfig } from '@/types/helena'
import { dataSourcePreferenceService } from '@/services/data/data-source-preference-service'

export function getHelenaApiConfig(): HelenaApiConfig {
  const baseUrl = process.env.HELENA_API_BASE_URL
  const token = process.env.HELENA_API_TOKEN

  if (!baseUrl) {
    throw new Error(
      'HELENA_API_BASE_URL environment variable is not set. ' +
      'Please create a .env.local file based on env.template'
    )
  }

  if (!token) {
    throw new Error(
      'HELENA_API_TOKEN environment variable is not set. ' +
      'Please create a .env.local file based on env.template'
    )
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
    timeout: Number.parseInt(process.env.HELENA_API_TIMEOUT || '30000', 10),
  }
}

export function isHelenaApiEnabled(cookieHeader?: string | null): boolean {
  const baseUrl = process.env.HELENA_API_BASE_URL
  const token = process.env.HELENA_API_TOKEN
  
  const useMockData = cookieHeader
    ? dataSourcePreferenceService.getDataSourceFromRequest(cookieHeader) === 'mock'
    : dataSourcePreferenceService.isUsingMockData()
  
  const isEnabled = !!baseUrl && !!token && !useMockData

  if (process.env.NODE_ENV === 'development') {
    console.log('[Helena Config] API Status Check:', {
      hasBaseUrl: !!baseUrl,
      hasToken: !!token,
      useMockData,
      isEnabled,
      baseUrl: baseUrl ? `${baseUrl.substring(0, 20)}...` : 'not set',
    })
  }

  return isEnabled
}

