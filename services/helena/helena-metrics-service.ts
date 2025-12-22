import { HelenaApiClient } from './helena-api-client'
import type { CrmMetrics, CrmDeal } from '@/types/crm'
import { HelenaCardsService } from './helena-cards-service'
import { HelenaPanelsService } from './helena-panels-service'

export class HelenaMetricsService {
  constructor(
    private readonly apiClient: HelenaApiClient,
    private readonly cardsService: HelenaCardsService,
    private readonly panelsService: HelenaPanelsService
  ) {}

  async getMetrics(params?: {
    pipelineId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<CrmMetrics> {
    try {
      const [cards, panels] = await Promise.all([
        this.cardsService.getAllCards({
          panelId: params?.pipelineId,
        }),
        this.panelsService.getAllPanels(),
      ])

      const filteredCards = this.filterCardsByDateRange(cards, params?.dateFrom, params?.dateTo)

      const totalDeals = filteredCards.length
      const totalValue = filteredCards.reduce((sum, card) => sum + card.value, 0)
      const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0

      const dealsByStage: Record<string, number> = {}
      const valueByStage: Record<string, number> = {}

      filteredCards.forEach((card) => {
        dealsByStage[card.stageId] = (dealsByStage[card.stageId] || 0) + 1
        valueByStage[card.stageId] = (valueByStage[card.stageId] || 0) + card.value
      })

      const wonCards = filteredCards.filter((card) => {
        const panel = panels.find((p) => p.id === card.pipelineId)
        const step = panel?.stages.find((s) => s.id === card.stageId)
        return step?.name.toLowerCase().includes('fechado') && 
               step?.name.toLowerCase().includes('ganho')
      })

      const conversionRate = totalDeals > 0 ? (wonCards.length / totalDeals) * 100 : 0

      return {
        totalDeals,
        totalValue,
        averageDealValue,
        conversionRate,
        dealsByStage,
        valueByStage,
      }
    } catch (error) {
      console.error('Error calculating metrics from Helena API:', error)
      throw error
    }
  }

  private filterCardsByDateRange(
    cards: CrmDeal[],
    dateFrom?: string,
    dateTo?: string
  ): CrmDeal[] {
    if (!dateFrom && !dateTo) {
      return cards
    }

    return cards.filter((card) => {
      const cardDate = new Date(card.createdAt)

      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        if (cardDate < fromDate) {
          return false
        }
      }

      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (cardDate > toDate) {
          return false
        }
      }

      return true
    })
  }
}

