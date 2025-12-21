import type { CrmPipeline, CrmMetrics, CrmDeal } from '@/types/crm'
import {
  generateMockPipelines,
  generateMockDeals,
  generateMockMetrics,
} from './mock-data-service'

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
    return this.fetchFromApi<CrmPipeline[]>('/api/crm/pipelines')
  }

  async getPipelineById(id: string): Promise<CrmPipeline> {
    return this.fetchFromApi<CrmPipeline>(`/api/crm/pipelines/${id}`)
  }

  async getDeals(params?: {
    pipelineId?: string
    stageId?: string
    status?: string
  }): Promise<CrmDeal[]> {
    const queryParams = new URLSearchParams()
    if (params?.pipelineId) {
      queryParams.append('pipelineId', params.pipelineId)
    }
    if (params?.stageId) {
      queryParams.append('stageId', params.stageId)
    }
    if (params?.status) {
      queryParams.append('status', params.status)
    }

    const queryString = queryParams.toString()
    const endpoint = `/api/crm/deals${queryString ? `?${queryString}` : ''}`

    return this.fetchFromApi<CrmDeal[]>(endpoint)
  }

  async getMetrics(params?: {
    pipelineId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<CrmMetrics> {
    const queryParams = new URLSearchParams()
    if (params?.pipelineId) {
      queryParams.append('pipelineId', params.pipelineId)
    }
    if (params?.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom)
    }
    if (params?.dateTo) {
      queryParams.append('dateTo', params.dateTo)
    }

    const queryString = queryParams.toString()
    const endpoint = `/api/crm/metrics${queryString ? `?${queryString}` : ''}`

    return this.fetchFromApi<CrmMetrics>(endpoint)
  }
}

export const crmApiService = new CrmApiService()

