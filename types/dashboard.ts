export interface DashboardFilters {
  date: string
  season: string
  sdr: string
  college: string
  origin: string
  panelId?: string // ID do painel específico ou undefined para todos
}

export interface GenerationActivationMetrics {
  leadsCreated: number
  leadsInGroup: number
  meetParticipants: number
  leadsCreatedByWeek: WeeklyData[]
}

export interface SalesConversionMetrics {
  closedSales: number
  closingRate: number
  targetRate: number
  revenueGenerated: number
  salesByWeek: WeeklyData[]
}

export interface ConversionRates {
  createdToGroup: {
    current: number
    target: number
  }
  groupToMeet: {
    current: number
    target: number
  }
  meetToSale: {
    current: number
    target: number
  }
}

export interface LeadStock {
  contactList: number
  firstContact: number
  inGroup: number
  postMeet: number
  // Valores monetários por categoria
  contactListValue: number
  firstContactValue: number
  inGroupValue: number
  postMeetValue: number
  totalValue: number
  // Detalhes por etapa
  byStep: Array<{
    stepId: string
    stepTitle: string
    count: number
    value: number
    category: 'contactList' | 'firstContact' | 'inGroup' | 'postMeet' | 'other'
  }>
}

export interface SalesByConversionTime {
  sevenDays: TimeSeriesData[]
  thirtyDays: TimeSeriesData[]
  ninetyDays: TimeSeriesData[]
  oneEightyDays: TimeSeriesData[]
}

export interface LeadQuality {
  origin: string
  meetParticipationRate: number
  purchaseRate: number
}

export interface WeeklyData {
  week: number
  value: number
  label: string
}

export interface TimeSeriesData {
  days: number
  value: number
}

export interface OperationalMetrics {
  pendingBeforePeriod: number
  newInPeriod: number
  completedInPeriod: number
  pendingAfterPeriod: number
}

export interface CapacityMetrics {
  new: {
    total: number
    averagePerDay: number
  }
  completed: {
    total: number
    averagePerDay: number
  }
  performance: number // ratio completed/new
}

export interface PerformanceMetrics {
  waitTime: {
    averageMinutes: number
    averageSeconds: number
    formatted: string
    consideredCount: number
    trend: string
  }
  duration: {
    averageHours: number
    averageMinutes: number
    formatted: string
    consideredCount: number
    trend: string
  }
}

export interface ChannelMetrics {
  channel: string
  count: number
}

export interface TagMetrics {
  tagId: string
  tagName: string
  count: number
  bgColor?: string
  textColor?: string
}

export interface DailyVolumeData {
  date: string
  count: number
  label: string
}

export interface OperationalDashboardData {
  operational: OperationalMetrics
  capacity: CapacityMetrics
  performance: PerformanceMetrics
  channels: ChannelMetrics[]
  topTags: TagMetrics[]
  dailyVolume: DailyVolumeData[]
}

export interface DashboardData {
  filters: DashboardFilters
  generationActivation: GenerationActivationMetrics
  salesConversion: SalesConversionMetrics
  conversionRates: ConversionRates
  leadStock: LeadStock
  salesByConversionTime: SalesByConversionTime
  leadQuality: LeadQuality[]
  operational?: OperationalDashboardData
  errors?: {
    cards?: string
    contacts?: string
    panels?: string
    wallets?: string
  }
}

