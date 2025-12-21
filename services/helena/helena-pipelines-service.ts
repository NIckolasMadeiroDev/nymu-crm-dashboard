import { HelenaApiClient } from './helena-api-client'
import type { HelenaPipeline, HelenaApiListResponse } from '@/types/helena'
import type { CrmPipeline, CrmStage } from '@/types/crm'

export class HelenaPipelinesService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllPipelines(): Promise<CrmPipeline[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaPipeline>>(
        '/pipelines'
      )

      const pipelines = response.data || []

      const pipelinesWithStages = await Promise.all(
        pipelines.map(async (pipeline) => {
          const stages = await this.getStagesForPipeline(pipeline.id)
          return this.transformPipeline(pipeline, stages)
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
      const pipeline = await this.apiClient.get<HelenaPipeline>(`/pipelines/${id}`)
      const stages = await this.getStagesForPipeline(id)
      return this.transformPipeline(pipeline, stages)
    } catch (error) {
      console.error(`Error fetching pipeline ${id} from Helena API:`, error)
      throw error
    }
  }

  private async getStagesForPipeline(pipelineId: string): Promise<CrmStage[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<{
        id: string
        name: string
        pipelineId: string
        order: number
        deals?: Array<{
          id: string
          title: string
          value: number
        }>
      }>>(`/pipelines/${pipelineId}/stages`)

      const stages = response.data || []

      return stages.map((stage) => {
        const deals = stage.deals || []
        const totalValue = deals.reduce((sum, deal) => sum + this.parseValue(deal.value), 0)

        return {
          id: stage.id,
          name: stage.name,
          deals: deals.map((deal) => ({
            id: deal.id,
            title: deal.title,
            value: this.parseValue(deal.value),
            stageId: stage.id,
            pipelineId: pipelineId,
            createdAt: '',
            updatedAt: '',
          })),
          totalValue,
          dealCount: deals.length,
        }
      })
    } catch (error) {
      console.error(`Error fetching stages for pipeline ${pipelineId}:`, error)
      return []
    }
  }

  private transformPipeline(
    pipeline: HelenaPipeline,
    stages: CrmStage[]
  ): CrmPipeline {
    const totalValue = stages.reduce((sum, stage) => sum + stage.totalValue, 0)
    const totalDeals = stages.reduce((sum, stage) => sum + stage.dealCount, 0)

    return {
      id: pipeline.id,
      name: pipeline.name,
      stages,
      totalValue,
      totalDeals,
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

