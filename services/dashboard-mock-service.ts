import type {
  DashboardData,
  DashboardFilters,
  GenerationActivationMetrics,
  SalesConversionMetrics,
  ConversionRates,
  LeadStock,
  SalesByConversionTime,
  LeadQuality,
  WeeklyData,
  TimeSeriesData,
} from '@/types/dashboard'

// Dados base para diferentes filtros
const SDRS = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza']
const COLLEGES = ['UNIFOR', 'UFC', 'UECE', 'FIC', 'FAMETRO']
const ORIGINS = ['Origem', 'Insta Turma', 'Atlética', 'Indicação', 'Facebook', 'Google Ads']

// Função para aplicar filtros aos dados
function applyFilters<T extends { origin?: string; sdr?: string; college?: string }>(
  data: T[],
  filters: DashboardFilters
): T[] {
  return data.filter((item) => {
    if (filters.origin && filters.origin !== '' && item.origin !== filters.origin) {
      return false
    }
    if (filters.sdr && filters.sdr !== 'Todos' && item.sdr !== filters.sdr) {
      return false
    }
    if (filters.college && filters.college !== 'Todas' && item.college !== filters.college) {
      return false
    }
    return true
  })
}

function generateWeeklyData(values: number[]): WeeklyData[] {
  return values.map((value, index) => ({
    week: index + 1,
    value,
    label: `Sem ${index + 1}`,
  }))
}

function generateTimeSeriesData(
  baseValue: number,
  growthRate: number,
  intervals: number[]
): TimeSeriesData[] {
  return intervals.map((days) => {
    const multiplier = 1 + (growthRate * days) / 100
    return {
      days,
      value: Math.round(baseValue * multiplier),
    }
  })
}

// Função para gerar dados baseado nos filtros
function calculateMetricsByFilters(filters: DashboardFilters) {
  // Multiplicadores baseados nos filtros
  let multiplier = 1

  if (filters.sdr && filters.sdr !== 'Todos') {
    // Cada SDR tem performance diferente
    const sdrIndex = SDRS.indexOf(filters.sdr)
    multiplier = 0.6 + (sdrIndex * 0.1) // Varia de 0.6 a 1.0
  }

  if (filters.college && filters.college !== 'Todas') {
    // Cada faculdade tem volume diferente
    const collegeIndex = COLLEGES.indexOf(filters.college)
    multiplier *= 0.5 + (collegeIndex * 0.15) // Varia de 0.5 a 1.25
  }

  if (filters.origin && filters.origin !== '') {
    // Cada origem tem conversão diferente
    const originIndex = ORIGINS.indexOf(filters.origin)
    const originMultipliers = [0.8, 1.2, 1.0, 1.5, 0.9, 1.1]
    multiplier *= originMultipliers[originIndex] || 1.0
  }

  return multiplier
}

export function generateMockFilters(): DashboardFilters {
  return {
    date: '2025-12-17',
    season: '2025.1',
    sdr: 'Todos',
    college: 'Todas',
    origin: '',
  }
}

export function generateMockGenerationActivation(
  filters?: DashboardFilters
): GenerationActivationMetrics {
  const baseLeadsByWeek = [160, 260, 180, 360, 230, 350, 300]
  const multiplier = filters ? calculateMetricsByFilters(filters) : 1

  const adjustedLeadsByWeek = baseLeadsByWeek.map((value) =>
    Math.round(value * multiplier)
  )

  const totalLeads = adjustedLeadsByWeek.reduce((sum, val) => sum + val, 0)
  const leadsInGroup = Math.round(totalLeads * 0.67)
  const meetParticipants = Math.round(leadsInGroup * 0.59)

  return {
    leadsCreated: totalLeads,
    leadsInGroup,
    meetParticipants,
    leadsCreatedByWeek: generateWeeklyData(adjustedLeadsByWeek),
  }
}

export function generateMockSalesConversion(
  filters?: DashboardFilters
): SalesConversionMetrics {
  const baseSalesByWeek = [70, 90, 120, 150, 180, 240]
  const multiplier = filters ? calculateMetricsByFilters(filters) : 1

  const adjustedSalesByWeek = baseSalesByWeek.map((value) =>
    Math.round(value * multiplier)
  )

  const totalSales = adjustedSalesByWeek.reduce((sum, val) => sum + val, 0)
  const revenue = totalSales * 2000 // R$ 2000 por venda média
  const closingRate = filters?.origin === 'Indicação' ? 40 : filters?.origin === 'Origem' ? 30 : 35

  return {
    closedSales: totalSales,
    closingRate,
    targetRate: 35,
    revenueGenerated: revenue,
    salesByWeek: generateWeeklyData(adjustedSalesByWeek),
  }
}

export function generateMockConversionRates(
  filters?: DashboardFilters
): ConversionRates {
  const activation = generateMockGenerationActivation(filters)
  const sales = generateMockSalesConversion(filters)

  const createdToGroupRate = (activation.leadsInGroup / activation.leadsCreated) * 100
  const groupToMeetRate = (activation.meetParticipants / activation.leadsInGroup) * 100
  const meetToSaleRate = (sales.closedSales / activation.meetParticipants) * 100

  return {
    createdToGroup: {
      current: createdToGroupRate,
      target: 70,
    },
    groupToMeet: {
      current: groupToMeetRate,
      target: 60,
    },
    meetToSale: {
      current: meetToSaleRate,
      target: 40,
    },
  }
}

export function generateMockLeadStock(filters?: DashboardFilters): LeadStock {
  const activation = generateMockGenerationActivation(filters)
  const sales = generateMockSalesConversion(filters)

  return {
    contactList: activation.leadsCreated,
    firstContact: activation.leadsInGroup,
    inGroup: activation.meetParticipants,
    postMeet: sales.closedSales,
  }
}

export function generateMockSalesByConversionTime(
  filters?: DashboardFilters
): SalesByConversionTime {
  const multiplier = filters ? calculateMetricsByFilters(filters) : 1

  // Função auxiliar para gerar curva de crescimento realista
  const generateGrowthCurve = (
    maxValue: number,
    timePoints: number[],
    conversionProfile: 'fast' | 'medium' | 'slow' | 'verySlow'
  ): TimeSeriesData[] => {
    return timePoints.map((dayValue) => {
      if (dayValue === 0) return { days: 0, value: 0 }
      
      let progress = 0
      
      // Diferentes perfis de conversão baseados no tempo
      switch (conversionProfile) {
        case 'fast': // 7 dias - crescimento rápido e acelerado
          progress = Math.min(1, Math.pow(dayValue / 120, 1.2))
          break
        case 'medium': // 30 dias - crescimento moderado
          progress = Math.min(1, Math.pow(dayValue / 120, 1.0))
          break
        case 'slow': // 90 dias - crescimento gradual
          progress = Math.min(1, Math.pow(dayValue / 120, 0.8))
          break
        case 'verySlow': // 180 dias - crescimento muito lento
          progress = Math.min(1, Math.pow(dayValue / 120, 0.6))
          break
      }
      
      const value = maxValue * progress
      
      // Adiciona pequena variação aleatória para realismo (±3%)
      const variation = (Math.random() - 0.5) * (maxValue * 0.03)
      
      return {
        days: dayValue,
        value: Math.max(0, Math.round((value + variation) * multiplier)),
      }
    })
  }

  // Pontos de tempo detalhados para melhor visualização
  const timePoints = [0, 7, 15, 30, 45, 60, 75, 90, 105, 120]

  return {
    // 7 Dias: Conversão rápida - maior volume, crescimento acelerado
    // Valores esperados: 0 → ~150 → ~400 → ~650 → ~850
    sevenDays: generateGrowthCurve(850, timePoints, 'fast'),

    // 30 Dias: Conversão moderada - volume médio, crescimento estável
    // Valores esperados: 0 → ~50 → ~150 → ~250 → ~320
    thirtyDays: generateGrowthCurve(320, timePoints, 'medium'),

    // 90 Dias: Conversão lenta - volume alto, crescimento gradual
    // Valores esperados: 0 → ~100 → ~300 → ~450 → ~580
    ninetyDays: generateGrowthCurve(580, timePoints, 'slow'),

    // 180 Dias: Conversão muito lenta - volume baixo, crescimento linear
    // Valores esperados: 0 → ~20 → ~60 → ~120 → ~180
    oneEightyDays: generateGrowthCurve(180, timePoints, 'verySlow'),
  }
}

export function generateMockLeadQuality(filters?: DashboardFilters): LeadQuality[] {
  const baseData: LeadQuality[] = [
    {
      origin: 'Origem',
      meetParticipationRate: 55,
      purchaseRate: 38,
    },
    {
      origin: 'Insta Turma',
      meetParticipationRate: 62,
      purchaseRate: 45,
    },
    {
      origin: 'Atlética',
      meetParticipationRate: 62,
      purchaseRate: 45,
    },
    {
      origin: 'Indicação',
      meetParticipationRate: 70,
      purchaseRate: 50,
    },
    {
      origin: 'Facebook',
      meetParticipationRate: 48,
      purchaseRate: 32,
    },
    {
      origin: 'Google Ads',
      meetParticipationRate: 52,
      purchaseRate: 35,
    },
  ]

  if (filters?.origin && filters.origin !== '') {
    return baseData.filter((item) => item.origin === filters.origin)
  }

  return baseData
}

export function generateMockDashboardData(filters?: DashboardFilters): DashboardData {
  const activeFilters = filters || generateMockFilters()

  return {
    filters: activeFilters,
    generationActivation: generateMockGenerationActivation(activeFilters),
    salesConversion: generateMockSalesConversion(activeFilters),
    conversionRates: generateMockConversionRates(activeFilters),
    leadStock: generateMockLeadStock(activeFilters),
    salesByConversionTime: generateMockSalesByConversionTime(activeFilters),
    leadQuality: generateMockLeadQuality(activeFilters),
  }
}

// Exportar constantes para uso nos componentes
export { SDRS, COLLEGES, ORIGINS }
