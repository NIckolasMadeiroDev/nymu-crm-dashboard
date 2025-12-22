import { HelenaApiClient } from './helena-api-client'
import type { HelenaPanel, HelenaPaginatedResponse, HelenaCard } from '@/types/helena'
import type { CrmPipeline, CrmStage } from '@/types/crm'

export class HelenaPanelsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllPanels(): Promise<CrmPipeline[]> {
    try {
      const allPanels: HelenaPanel[] = []
      let pageNumber = 1
      const pageSize = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await this.apiClient.get<HelenaPaginatedResponse<HelenaPanel>>(
          'crm/panel',
          {
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
          }
        )

        if (response.items && response.items.length > 0) {
          allPanels.push(...response.items)
        }

        hasMorePages = response.hasMorePages || false
        pageNumber++

        if (pageNumber > response.totalPages) {
          break
        }
      }

      const panelsWithSteps = await Promise.all(
        allPanels.map(async (panel) => {
          const steps = await this.getStepsForPanel(panel.id)
          return this.transformPanel(panel, steps)
        })
      )

      return panelsWithSteps
    } catch (error) {
      console.error('Error fetching panels from Helena API:', error)
      throw error
    }
  }

  async getPanelById(id: string): Promise<CrmPipeline> {
    try {
      const panel = await this.apiClient.get<HelenaPanel>(`crm/panel/${id}`)
      const steps = await this.getStepsForPanel(id)
      return this.transformPanel(panel, steps)
    } catch (error) {
      console.error(`Error fetching panel ${id} from Helena API:`, error)
      throw error
    }
  }

  private async getStepsForPanel(panelId: string): Promise<CrmStage[]> {
    try {
      const allCards: HelenaCard[] = []
      let pageNumber = 1
      const pageSize = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await this.apiClient.get<HelenaPaginatedResponse<HelenaCard>>(
          'crm/panel/card',
          {
            PanelId: panelId,
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
          }
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

      const stepsMap = new Map<string, CrmStage>()

      allCards.forEach((card) => {
        const stepId = card.stepId || 'unknown'
        const stepName = card.stepTitle || card.stepId || 'Sem etapa'

        if (!stepsMap.has(stepId)) {
          stepsMap.set(stepId, {
            id: stepId,
            name: stepName,
            deals: [],
            totalValue: 0,
            dealCount: 0,
          })
        }

        const step = stepsMap.get(stepId)!
        const cardValue = card.monetaryAmount || card.value || 0
        step.deals.push({
          id: card.id,
          title: card.title || '',
          value: cardValue,
          stageId: stepId,
          pipelineId: panelId,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          owner: card.responsibleUserId || card.ownerId,
        })
        step.totalValue += cardValue
        step.dealCount++
      })

      return Array.from(stepsMap.values())
    } catch (error) {
      console.error(`Error fetching steps for panel ${panelId}:`, error)
      return []
    }
  }

  private transformPanel(panel: HelenaPanel, steps: CrmStage[]): CrmPipeline {
    const totalValue = steps.reduce((sum, stage) => sum + stage.totalValue, 0)
    const totalDeals = steps.reduce((sum, stage) => sum + stage.dealCount, 0)

    return {
      id: panel.id,
      name: panel.name,
      stages: steps,
      totalValue,
      totalDeals,
    }
  }
}

