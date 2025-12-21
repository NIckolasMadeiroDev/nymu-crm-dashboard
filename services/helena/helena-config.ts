import type { HelenaApiConfig } from '@/types/helena'

export function getHelenaApiConfig(): HelenaApiConfig {
  const baseUrl = process.env.HELENA_API_BASE_URL
  const token = process.env.HELENA_API_TOKEN

  if (!baseUrl) {
    throw new Error('HELENA_API_BASE_URL environment variable is not set')
  }

  if (!token) {
    throw new Error('HELENA_API_TOKEN environment variable is not set')
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
    timeout: parseInt(process.env.HELENA_API_TIMEOUT || '30000', 10),
  }
}

export function isHelenaApiEnabled(): boolean {
  return (
    !!process.env.HELENA_API_BASE_URL &&
    !!process.env.HELENA_API_TOKEN &&
    process.env.USE_MOCK_DATA !== 'true'
  )
}

