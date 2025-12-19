export interface DashboardFilters {
  date: string
  season: string
  sdr: string
  college: string
  origin: string
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

export interface DashboardData {
  filters: DashboardFilters
  generationActivation: GenerationActivationMetrics
  salesConversion: SalesConversionMetrics
  conversionRates: ConversionRates
  leadStock: LeadStock
  salesByConversionTime: SalesByConversionTime
  leadQuality: LeadQuality[]
}

