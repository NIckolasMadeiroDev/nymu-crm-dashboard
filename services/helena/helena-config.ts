import type { HelenaApiConfig } from '@/types/helena'

export function getHelenaApiConfig(): HelenaApiConfig {
  const baseUrl = process.env.HELENA_API_BASE_URL || 'https://api.helena.run'
  const token = process.env.HELENA_API_TOKEN || 'pn_1ZmOn2UfqhH1X4vXOqadH13SECguNaEJtqYPjN5chQw'

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
    timeout: Number.parseInt(process.env.HELENA_API_TIMEOUT || '30000', 10),
  }
}

export function isHelenaApiEnabled(cookieHeader?: string | null): boolean {
  const baseUrl = process.env.HELENA_API_BASE_URL || 'https://api.helena.run'
  const token = process.env.HELENA_API_TOKEN || 'pn_1ZmOn2UfqhH1X4vXOqadH13SECguNaEJtqYPjN5chQw'
  
  const isEnabled = !!(baseUrl && token)

  if (process.env.NODE_ENV === 'development') {
    console.log('[Helena Config] API Status Check:', {
      hasBaseUrl: !!baseUrl,
      hasToken: !!token,
      isEnabled,
      baseUrl: baseUrl ? `${baseUrl.substring(0, 20)}...` : 'not set',
    })
  }

  return isEnabled
}

