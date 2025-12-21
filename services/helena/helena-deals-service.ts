import { HelenaApiClient } from './helena-api-client'
import type { HelenaDeal, HelenaApiListResponse } from '@/types/helena'
import type { CrmDeal } from '@/types/crm'

export class HelenaDealsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllDeals(params?: {
    page?: number
    limit?: number
    pipelineId?: string
    stageId?: string
    status?: string
  }): Promise<CrmDeal[]> {
    try {
      const queryParams: Record<string, string> = {}

      if (params?.page) {
        queryParams.page = params.page.toString()
      }
      if (params?.limit) {
        queryParams.limit = params.limit.toString()
      }
      if (params?.pipelineId) {
        queryParams.pipelineId = params.pipelineId
      }
      if (params?.stageId) {
        queryParams.stageId = params.stageId
      }
      if (params?.status) {
        queryParams.status = params.status
      }

      const response = await this.apiClient.get<HelenaApiListResponse<HelenaDeal>>(
        '/deals',
        queryParams
      )

      return this.transformDeals(response.data || [])
    } catch (error) {
      console.error('Error fetching deals from Helena API:', error)
      throw error
    }
  }

  async getDealById(id: string): Promise<CrmDeal> {
    try {
      const deal = await this.apiClient.get<HelenaDeal>(`/deals/${id}`)
      return this.transformDeal(deal)
    } catch (error) {
      console.error(`Error fetching deal ${id} from Helena API:`, error)
      throw error
    }
  }

  async getDealsByPipeline(pipelineId: string): Promise<CrmDeal[]> {
    return this.getAllDeals({ pipelineId })
  }

  async getDealsByStage(stageId: string): Promise<CrmDeal[]> {
    return this.getAllDeals({ stageId })
  }

  private transformDeals(deals: HelenaDeal[]): CrmDeal[] {
    return deals.map((deal) => this.transformDeal(deal))
  }

  private transformDeal(deal: HelenaDeal): CrmDeal {
    return {
      id: deal.id,
      title: deal.title,
      value: this.parseValue(deal.value),
      stageId: deal.stageId,
      pipelineId: deal.pipelineId,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      owner: deal.ownerId,
    }
  }

  private parseValue(value: unknown): number {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
}

