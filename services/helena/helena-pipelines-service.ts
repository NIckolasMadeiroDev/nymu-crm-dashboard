import { HelenaApiClient } from './helena-api-client'
import { helenaServiceFactory } from './helena-service-factory'
import type { HelenaPaginatedResponse } from '@/types/helena'
import type { HelenaPanel } from './helena-panels-service'
import type { CrmPipeline, CrmStage } from '@/types/crm'

export class HelenaPipelinesService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllPipelines(): Promise<CrmPipeline[]> {
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

      const pipelinesWithStages = await Promise.all(
        allPanels.map(async (panel: HelenaPanel) => {
          const stages = await this.getStagesForPipeline(panel.id)
          return this.transformPipeline(panel, stages)
        })
      )

      return pipelinesWithStages
    } catch (error) {
      console.error('Error fetching pipelines from Helena API:', error)
      throw error
    }
  }

  async getPipelineById(id: string): Promise<CrmPipeline> {
    try {
      const panel = await this.apiClient.get<HelenaPanel>(`crm/panel/${id}`)
      const stages = await this.getStagesForPipeline(id)
      return this.transformPipeline(panel, stages)
    } catch (error) {
      console.error(`Error fetching pipeline ${id} from Helena API:`, error)
      throw error
    }
  }

  private async getStagesForPipeline(panelId: string): Promise<CrmStage[]> {
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      const cards = await cardsService.getAllCardsByPanel(panelId)

      const stepsMap = new Map<string, CrmStage>()

      cards.forEach((card: any) => {
        const stepId = card.stepId || card.stageId || 'unknown'
        const stepName = card.stepTitle || card.stepId || card.stageId || 'Sem etapa'

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
        step.deals.push({
          id: card.id,
          title: card.title,
          value: card.value,
          stageId: stepId,
          pipelineId: panelId,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          owner: card.owner,
        })
        step.totalValue += card.value
        step.dealCount++
      })

      return Array.from(stepsMap.values())
    } catch (error) {
      console.error(`Error fetching stages for pipeline ${panelId}:`, error)
      return []
    }
  }

  private transformPipeline(
    panel: HelenaPanel,
    stages: CrmStage[]
  ): CrmPipeline {
    const totalValue = stages.reduce((sum: number, stage: CrmStage) => sum + stage.totalValue, 0)
    const totalDeals = stages.reduce((sum: number, stage: CrmStage) => sum + stage.dealCount, 0)

    return {
      id: panel.id,
      name: panel.title,
      stages,
      totalValue,
      totalDeals,
    }
  }
}

