import { HelenaApiClient } from './helena-api-client'
import type { HelenaCard, HelenaApiListResponse } from '@/types/helena'
import type { CrmDeal } from '@/types/crm'

export class HelenaCardsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllCards(params?: {
    page?: number
    limit?: number
    panelId?: string
    stepId?: string
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
      if (params?.panelId) {
        queryParams.panelId = params.panelId
      }
      if (params?.stepId) {
        queryParams.stepId = params.stepId
      }
      if (params?.status) {
        queryParams.status = params.status
      }

      const response = await this.apiClient.get<HelenaApiListResponse<HelenaCard>>(
        '/crm/cards',
        queryParams
      )

      return this.transformCards(response.data || [])
    } catch (error) {
      console.error('Error fetching cards from Helena API:', error)
      throw error
    }
  }

  async getCardById(id: string): Promise<CrmDeal> {
    try {
      const card = await this.apiClient.get<HelenaCard>(`/crm/cards/${id}`)
      return this.transformCard(card)
    } catch (error) {
      console.error(`Error fetching card ${id} from Helena API:`, error)
      throw error
    }
  }

  async getCardsByPanel(panelId: string): Promise<CrmDeal[]> {
    return this.getAllCards({ panelId })
  }

  async getCardsByStep(stepId: string): Promise<CrmDeal[]> {
    return this.getAllCards({ stepId })
  }

  async createCard(card: Partial<HelenaCard>): Promise<CrmDeal> {
    try {
      const created = await this.apiClient.post<HelenaCard>('/crm/cards', card)
      return this.transformCard(created)
    } catch (error) {
      console.error('Error creating card in Helena API:', error)
      throw error
    }
  }

  async updateCard(id: string, card: Partial<HelenaCard>): Promise<CrmDeal> {
    try {
      const updated = await this.apiClient.put<HelenaCard>(`/crm/cards/${id}`, card)
      return this.transformCard(updated)
    } catch (error) {
      console.error(`Error updating card ${id} in Helena API:`, error)
      throw error
    }
  }

  async duplicateCard(id: string): Promise<CrmDeal> {
    try {
      const duplicated = await this.apiClient.post<HelenaCard>(`/crm/cards/${id}/duplicate`)
      return this.transformCard(duplicated)
    } catch (error) {
      console.error(`Error duplicating card ${id} in Helena API:`, error)
      throw error
    }
  }

  private transformCards(cards: HelenaCard[]): CrmDeal[] {
    return cards.map((card) => this.transformCard(card))
  }

  private transformCard(card: HelenaCard): CrmDeal {
    return {
      id: card.id,
      title: card.title,
      value: this.parseValue(card.value),
      stageId: card.stepId || '',
      pipelineId: card.panelId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      owner: card.ownerId,
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

