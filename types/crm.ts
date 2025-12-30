export interface CrmPipeline {
  id: string
  name: string
  stages: CrmStage[]
  totalValue: number
  totalDeals: number
}

export interface CrmStage {
  id: string
  name: string
  deals: CrmDeal[]
  totalValue: number
  dealCount: number
}

export interface CrmDeal {
  id: string
  title: string
  value: number
  stageId: string
  pipelineId: string
  createdAt: string
  updatedAt: string
  owner?: string
  // Campos adicionais retornados pela API de deals
  closedAt?: string
  relevantDate?: string
  relevantDateFormatted?: string
  valueFormatted?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  ownerName?: string
  ownerEmail?: string
  contactIds?: string[]
  createdAtFormatted?: string
  closedAtFormatted?: string
  updatedAtFormatted?: string
}

export interface CrmMetrics {
  totalDeals: number
  totalValue: number
  averageDealValue: number
  conversionRate: number
  dealsByStage: Record<string, number>
  valueByStage: Record<string, number>
}

export interface CrmApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

