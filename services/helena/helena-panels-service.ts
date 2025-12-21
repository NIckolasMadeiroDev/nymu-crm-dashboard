import { HelenaApiClient } from './helena-api-client'
import type { HelenaPanel, HelenaApiListResponse } from '@/types/helena'
import type { CrmPipeline, CrmStage } from '@/types/crm'

export class HelenaPanelsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllPanels(): Promise<CrmPipeline[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaPanel>>(
        '/crm/panels'
      )

      const panels = response.data || []

      const panelsWithSteps = await Promise.all(
        panels.map(async (panel) => {
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
      const panel = await this.apiClient.get<HelenaPanel>(`/crm/panels/${id}`)
      const steps = await this.getStepsForPanel(id)
      return this.transformPanel(panel, steps)
    } catch (error) {
      console.error(`Error fetching panel ${id} from Helena API:`, error)
      throw error
    }
  }

  private async getStepsForPanel(panelId: string): Promise<CrmStage[]> {
    try {
      const panel = await this.apiClient.get<HelenaPanel>(`/crm/panels/${panelId}`)
      const steps = panel.steps || []

      return steps.map((step) => {
        const cards = step.cards || []
        const totalValue = cards.reduce((sum, card) => {
          const value = typeof card.value === 'number' ? card.value : 0
          return sum + value
        }, 0)

        return {
          id: step.id,
          name: step.name,
          deals: cards.map((card) => ({
            id: card.id,
            title: card.title,
            value: typeof card.value === 'number' ? card.value : 0,
            stageId: step.id,
            pipelineId: panelId,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
            owner: card.ownerId,
          })),
          totalValue,
          dealCount: cards.length,
        }
      })
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

