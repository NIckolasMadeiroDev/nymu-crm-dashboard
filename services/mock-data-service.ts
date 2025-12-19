import type { CrmPipeline, CrmStage, CrmDeal, CrmMetrics } from '@/types/crm'

const STAGE_NAMES = [
  'Qualificação',
  'Proposta Enviada',
  'Negociação',
  'Aprovação',
  'Fechado Ganho',
  'Fechado Perdido',
]

const DEAL_TITLES = [
  'Contrato Empresa ABC',
  'Projeto Sistema XYZ',
  'Implementação Plataforma',
  'Consultoria Estratégica',
  'Desenvolvimento Customizado',
  'Integração de Sistemas',
  'Suporte Técnico Anual',
  'Treinamento Corporativo',
  'Licenciamento Software',
  'Manutenção Preventiva',
  'Auditoria de Processos',
  'Otimização de Infraestrutura',
]

const PIPELINE_NAMES = [
  'Vendas Corporativas',
  'Vendas SMB',
  'Parcerias',
  'Renovação',
]

function getHourBasedSeed(): number {
  const now = new Date()
  return now.getHours()
}

function generateRandomValue(min: number, max: number, seed: number): number {
  const normalizedSeed = (seed % 24) / 24
  const range = max - min
  return Math.floor(min + range * normalizedSeed * 0.7 + Math.random() * range * 0.3)
}

function generateDealValue(seed: number): number {
  const baseValues = [5000, 10000, 25000, 50000, 100000, 250000, 500000]
  const baseValue = baseValues[seed % baseValues.length]
  const variation = baseValue * (0.5 + Math.random() * 0.5)
  return Math.round(variation)
}

function generateDeal(seed: number, stageId: string, pipelineId: string, index: number): CrmDeal {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()))

  return {
    id: `deal-${pipelineId}-${stageId}-${index}`,
    title: `${DEAL_TITLES[(seed + index) % DEAL_TITLES.length]} ${index + 1}`,
    value: generateDealValue(seed + index),
    stageId,
    pipelineId,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    owner: `Vendedor ${String.fromCharCode(65 + (index % 5))}`,
  }
}

function generateStage(seed: number, pipelineId: string, stageIndex: number): CrmStage {
  const stageName = STAGE_NAMES[stageIndex % STAGE_NAMES.length]
  const stageId = `stage-${pipelineId}-${stageIndex}`
  const dealCount = generateRandomValue(2, 8, seed + stageIndex)
  const deals: CrmDeal[] = []

  for (let i = 0; i < dealCount; i++) {
    deals.push(generateDeal(seed + stageIndex + i, stageId, pipelineId, i))
  }

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

  return {
    id: stageId,
    name: stageName,
    deals,
    totalValue,
    dealCount,
  }
}

function generatePipeline(seed: number, index: number): CrmPipeline {
  const pipelineName = PIPELINE_NAMES[index % PIPELINE_NAMES.length]
  const stageCount = generateRandomValue(4, 6, seed + index)
  const stages: CrmStage[] = []

  for (let i = 0; i < stageCount; i++) {
    stages.push(generateStage(seed + index, `pipeline-${index}`, i))
  }

  const totalValue = stages.reduce((sum, stage) => sum + stage.totalValue, 0)
  const totalDeals = stages.reduce((sum, stage) => sum + stage.dealCount, 0)

  return {
    id: `pipeline-${index}`,
    name: pipelineName,
    stages,
    totalValue,
    totalDeals,
  }
}

export function generateMockPipelines(): CrmPipeline[] {
  const seed = getHourBasedSeed()
  const pipelineCount = 3 + (seed % 2)
  const pipelines: CrmPipeline[] = []

  for (let i = 0; i < pipelineCount; i++) {
    pipelines.push(generatePipeline(seed, i))
  }

  return pipelines
}

export function generateMockDeals(): CrmDeal[] {
  const pipelines = generateMockPipelines()
  const deals: CrmDeal[] = []

  pipelines.forEach((pipeline) => {
    pipeline.stages.forEach((stage) => {
      deals.push(...stage.deals)
    })
  })

  return deals.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function generateMockMetrics(): CrmMetrics {
  const pipelines = generateMockPipelines()
  const deals = generateMockDeals()
  
  const totalDeals = deals.length
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0

  // Find closed won deals by checking stage names through pipelines
  const closedWonStageNames = new Set<string>()
  pipelines.forEach((pipeline) => {
    pipeline.stages.forEach((stage) => {
      if (stage.name.includes('Fechado Ganho')) {
        closedWonStageNames.add(stage.id)
      }
    })
  })

  const closedDeals = deals.filter((deal) => 
    closedWonStageNames.has(deal.stageId)
  ).length
  const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0

  const dealsByStage: Record<string, number> = {}
  const valueByStage: Record<string, number> = {}

  pipelines.forEach((pipeline) => {
    pipeline.stages.forEach((stage) => {
      dealsByStage[stage.name] = (dealsByStage[stage.name] || 0) + stage.dealCount
      valueByStage[stage.name] = (valueByStage[stage.name] || 0) + stage.totalValue
    })
  })

  return {
    totalDeals,
    totalValue,
    averageDealValue,
    conversionRate,
    dealsByStage,
    valueByStage,
  }
}

