import { HelenaApiClient } from './helena-api-client'
import type { HelenaCard, HelenaPaginatedResponse } from '@/types/helena'
import type { CrmDeal } from '@/types/crm'

export class HelenaCardsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllCards(params?: {
    panelId?: string
    stepId?: string
    contactId?: string
    responsibleUserId?: string
    textFilter?: string
    includeArchived?: boolean
  }): Promise<CrmDeal[]> {
    try {
      const allCards: HelenaCard[] = []
      let pageNumber = 1
      const pageSize = 100
      let hasMorePages = true

      while (hasMorePages) {
        const queryParams: Record<string, string> = {
          pageNumber: pageNumber.toString(),
          pageSize: pageSize.toString(),
        }

        if (params?.panelId) {
          queryParams.PanelId = params.panelId
        }
        if (params?.stepId) {
          queryParams.StepId = params.stepId
        }
        if (params?.contactId) {
          queryParams.ContactId = params.contactId
        }
        if (params?.responsibleUserId) {
          queryParams.ResponsibleUserId = params.responsibleUserId
        }
        if (params?.textFilter) {
          queryParams.TextFilter = params.textFilter
        }
        if (params?.includeArchived !== undefined) {
          queryParams.IncludeArchived = params.includeArchived.toString()
        }

        const response = await this.apiClient.get<HelenaPaginatedResponse<HelenaCard>>(
          'crm/panel/card',
          queryParams
        )

        if (response.items && response.items.length > 0) {
          allCards.push(...response.items)
        }

        hasMorePages = response.hasMorePages || false
        pageNumber++

        if (pageNumber > response.totalPages) {
          break
        }
      }

      return this.transformCards(allCards)
    } catch (error) {
      console.error('Error fetching cards from Helena API:', error)
      throw error
    }
  }

  async getCardById(id: string): Promise<CrmDeal> {
    try {
      const card = await this.apiClient.get<HelenaCard>(`crm/panel/card/${id}`)
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
      const created = await this.apiClient.post<HelenaCard>('crm/panel/card', card)
      return this.transformCard(created)
    } catch (error) {
      console.error('Error creating card in Helena API:', error)
      throw error
    }
  }

  async updateCard(id: string, card: Partial<HelenaCard>): Promise<CrmDeal> {
    try {
      const updated = await this.apiClient.put<HelenaCard>(`crm/panel/card/${id}`, card)
      return this.transformCard(updated)
    } catch (error) {
      console.error(`Error updating card ${id} in Helena API:`, error)
      throw error
    }
  }

  async duplicateCard(id: string): Promise<CrmDeal> {
    try {
      const duplicated = await this.apiClient.post<HelenaCard>(`crm/panel/card/${id}/duplicate`)
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
      title: card.title || '',
      value: this.parseValue(card.monetaryAmount || card.value),
      stageId: card.stepId || '',
      pipelineId: card.panelId || '',
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      owner: card.responsibleUserId || card.ownerId,
    }
  }

  private parseValue(value: unknown): number {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replaceAll(/[^\d.-]/g, ''))
      return Number.isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
}

