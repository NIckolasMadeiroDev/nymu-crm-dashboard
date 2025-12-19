import type { CrmPipeline, CrmMetrics, CrmDeal } from '@/types/crm'
import {
  generateMockPipelines,
  generateMockDeals,
  generateMockMetrics,
} from './mock-data-service'

// Temporarily force mock data usage - no API calls
const USE_MOCK_DATA = true

class CrmApiService {
  private async fetchFromApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.statusText}`)
    }

    const data: T = await response.json()
    return data
  }

  async getPipelines(): Promise<CrmPipeline[]> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(generateMockPipelines()), 300)
      })
    }
    return this.fetchFromApi<CrmPipeline[]>('/api/crm/pipelines')
  }

  async getPipelineById(id: string): Promise<CrmPipeline> {
    if (USE_MOCK_DATA) {
      const pipelines = generateMockPipelines()
      const pipeline = pipelines.find((p) => p.id === id)
      if (!pipeline) {
        throw new Error(`Pipeline ${id} not found`)
      }
      return new Promise((resolve) => {
        setTimeout(() => resolve(pipeline), 300)
      })
    }
    return this.fetchFromApi<CrmPipeline>(`/api/crm/pipelines/${id}`)
  }

  async getDeals(): Promise<CrmDeal[]> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(generateMockDeals()), 300)
      })
    }
    return this.fetchFromApi<CrmDeal[]>('/api/crm/deals')
  }

  async getMetrics(): Promise<CrmMetrics> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(generateMockMetrics()), 300)
      })
    }
    return this.fetchFromApi<CrmMetrics>('/api/crm/metrics')
  }
}

export const crmApiService = new CrmApiService()

