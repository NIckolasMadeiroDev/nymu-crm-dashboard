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
import type { HelenaContact } from '@/types/helena'
import type { CrmDeal } from '@/types/crm'

interface LeadLike {
  id: string
  name: string
  source?: string
  status?: string
  createdAt: string
  updatedAt: string
}

import { helenaServiceFactory } from '../helena-service-factory'
import { HelenaApiError } from '@/types/helena'

export class DashboardAdapter {
  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Fetching data from Helena API...')
    }

    const cardsService = helenaServiceFactory.getCardsService()
    const contactsService = helenaServiceFactory.getContactsService()
    const panelsService = helenaServiceFactory.getPanelsService()
    const walletsService = helenaServiceFactory.getWalletsService()

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Fetching cards, contacts, panels, and wallets...')
    }

    const errors: {
      cards?: string
      contacts?: string
      panels?: string
      wallets?: string
    } = {}

    const getErrorMessage = (error: unknown): string => {
      if (error instanceof HelenaApiError) {
        const status = error.status
        if (status === 404) {
          return 'Not Found (404) - Endpoint não existe'
        }
        if (status === 403) {
          return 'Forbidden (403) - Sem permissão'
        }
        if (status === 401) {
          return 'Unauthorized (401) - Token inválido'
        }
        if (status === 429) {
          return 'Rate Limit (429) - Muitas requisições, aguarde'
        }
        return `HTTP ${status || 'Unknown'}: ${error.message}`
      }
      return error instanceof Error ? error.message : 'Erro desconhecido'
    }

    const results = await Promise.allSettled([
      cardsService.getAllCards().catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.cards = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching cards:', errorMessage)
        }
        return []
      }),
      contactsService.getAllContacts().catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.contacts = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching contacts:', errorMessage)
        }
        return []
      }),
      panelsService.getAllPanels().catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.panels = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching panels:', errorMessage)
        }
        return []
      }),
      walletsService.getAllWallets().catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.wallets = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching wallets:', errorMessage)
        }
        return []
      }),
    ])

    const cards = results[0].status === 'fulfilled' ? results[0].value : []
    const contacts = results[1].status === 'fulfilled' ? results[1].value : []
    const panels = results[2].status === 'fulfilled' ? results[2].value : []
    const wallets = results[3].status === 'fulfilled' ? results[3].value : []

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Fetched:', {
        cards: cards.length,
        contacts: contacts.length,
        panels: panels.length,
        wallets: wallets.length,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      })
    }

    const leads: LeadLike[] = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      source: contact.customFields?.source as string | undefined,
      status: contact.customFields?.status as string | undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }))

    const deals = cards

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Processing data:', {
        totalLeads: leads.length,
        totalDeals: deals.length,
        totalContacts: contacts.length,
        totalPanels: panels.length,
        totalWallets: wallets.length,
      })
    }

    const filteredLeads = this.filterLeads(leads, filters)
    const filteredDeals = this.filterDeals(deals, filters)
    const filteredContacts = this.filterContacts(contacts, filters)

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Filtered data:', {
        filteredLeads: filteredLeads.length,
        filteredDeals: filteredDeals.length,
        filteredContacts: filteredContacts.length,
      })
    }

    const dashboardData: DashboardData = {
      filters,
      generationActivation: this.buildGenerationActivation(filteredLeads, filteredContacts),
      salesConversion: this.buildSalesConversion(filteredDeals),
      conversionRates: this.buildConversionRates(filteredLeads, filteredDeals),
      leadStock: this.buildLeadStock(filteredLeads, filteredContacts),
      salesByConversionTime: this.buildSalesByConversionTime(filteredDeals),
      leadQuality: this.buildLeadQuality(filteredLeads, filteredDeals),
    }

    if (Object.keys(errors).length > 0) {
      dashboardData.errors = errors
    }

    return dashboardData
  }

  private getDateFromFilter(date: string): string {
    const dateObj = new Date(date)
    dateObj.setMonth(dateObj.getMonth() - 3)
    return dateObj.toISOString().split('T')[0]
  }

  private filterLeads(leads: LeadLike[], filters: DashboardFilters): LeadLike[] {
    return leads.filter((lead) => {
      if (filters.origin && filters.origin !== '' && lead.source !== filters.origin) {
        return false
      }
      return true
    })
  }

  private filterDeals(deals: CrmDeal[], filters: DashboardFilters): CrmDeal[] {
    return deals.filter((deal) => {
      if (filters.sdr && filters.sdr !== 'Todos' && deal.owner !== filters.sdr) {
        return false
      }
      return true
    })
  }

  private filterContacts(contacts: HelenaContact[], filters: DashboardFilters): HelenaContact[] {
    return contacts
  }

  private buildGenerationActivation(
    leads: LeadLike[],
    contacts: HelenaContact[]
  ): GenerationActivationMetrics {
    const leadsCreated = leads.length
    const leadsInGroup = leads.filter((lead) => lead.status === 'in_group').length
    const meetParticipants = leads.filter((lead) => lead.status === 'meet_participant').length

    const leadsByWeek = this.groupLeadsByWeek(leads)
    const leadsCreatedByWeek: WeeklyData[] = leadsByWeek.map((count, index) => ({
      week: index + 1,
      value: count,
      label: `Sem ${index + 1}`,
    }))

    return {
      leadsCreated,
      leadsInGroup,
      meetParticipants,
      leadsCreatedByWeek,
    }
  }

  private buildSalesConversion(deals: CrmDeal[]): SalesConversionMetrics {
    const closedSales = deals.length
    const revenueGenerated = deals.reduce((sum, deal) => sum + deal.value, 0)
    const closingRate = closedSales > 0 ? (closedSales / (closedSales * 1.5)) * 100 : 0
    const targetRate = 75

    const salesByWeek = this.groupDealsByWeek(deals)
    const salesByWeekData: WeeklyData[] = salesByWeek.map((count, index) => ({
      week: index + 1,
      value: count,
      label: `Sem ${index + 1}`,
    }))

    return {
      closedSales,
      closingRate,
      targetRate,
      revenueGenerated,
      salesByWeek: salesByWeekData,
    }
  }

  private buildConversionRates(
    leads: LeadLike[],
    deals: CrmDeal[]
  ): ConversionRates {
    const leadsCreated = leads.length
    const leadsInGroup = leads.filter((lead) => lead.status === 'in_group').length
    const meetParticipants = leads.filter((lead) => lead.status === 'meet_participant').length
    const sales = deals.length

    return {
      createdToGroup: {
        current: leadsCreated > 0 ? (leadsInGroup / leadsCreated) * 100 : 0,
        target: 80,
      },
      groupToMeet: {
        current: leadsInGroup > 0 ? (meetParticipants / leadsInGroup) * 100 : 0,
        target: 60,
      },
      meetToSale: {
        current: meetParticipants > 0 ? (sales / meetParticipants) * 100 : 0,
        target: 40,
      },
    }
  }

  private buildLeadStock(leads: LeadLike[], contacts: HelenaContact[]): LeadStock {
    return {
      contactList: contacts.length,
      firstContact: leads.filter((lead) => lead.status === 'first_contact').length,
      inGroup: leads.filter((lead) => lead.status === 'in_group').length,
      postMeet: leads.filter((lead) => lead.status === 'post_meet').length,
    }
  }

  private buildSalesByConversionTime(
    deals: CrmDeal[]
  ): SalesByConversionTime {
    const sevenDays = this.calculateConversionTimeData(deals, 7)
    const thirtyDays = this.calculateConversionTimeData(deals, 30)
    const ninetyDays = this.calculateConversionTimeData(deals, 90)
    const oneEightyDays = this.calculateConversionTimeData(deals, 180)

    return {
      sevenDays,
      thirtyDays,
      ninetyDays,
      oneEightyDays,
    }
  }

  private calculateConversionTimeData(
    deals: CrmDeal[],
    maxDays: number
  ): TimeSeriesData[] {
    const intervals = [1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180].filter(
      (days) => days <= maxDays
    )

    return intervals.map((days) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const dealsInPeriod = deals.filter((deal) => {
        const dealDate = new Date(deal.createdAt)
        return dealDate >= cutoffDate
      })

      const value = dealsInPeriod.reduce((sum, deal) => sum + deal.value, 0)

      return {
        days,
        value,
      }
    })
  }

  private buildLeadQuality(leads: LeadLike[], deals: CrmDeal[]): LeadQuality[] {
    const sources = Array.from(new Set(leads.map((lead) => lead.source || 'Unknown')))

    return sources.map((source) => {
      const sourceLeads = leads.filter((lead) => lead.source === source)
      const meetParticipants = sourceLeads.filter((lead) => lead.status === 'meet_participant').length
      const purchases = deals.length

      const meetParticipationRate =
        sourceLeads.length > 0 ? (meetParticipants / sourceLeads.length) * 100 : 0
      const purchaseRate = meetParticipants > 0 ? (purchases / meetParticipants) * 100 : 0

      return {
        origin: source,
        meetParticipationRate,
        purchaseRate,
      }
    })
  }

  private groupLeadsByWeek(leads: LeadLike[]): number[] {
    const weeks: number[] = new Array(12).fill(0)

    leads.forEach((lead) => {
      const leadDate = new Date(lead.createdAt)
      const weekIndex = Math.floor(
        (Date.now() - leadDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )

      if (weekIndex >= 0 && weekIndex < 12) {
        weeks[weekIndex]++
      }
    })

    return weeks
  }

  private groupDealsByWeek(deals: CrmDeal[]): number[] {
    const weeks: number[] = new Array(12).fill(0)

    deals.forEach((deal) => {
      const dealDate = new Date(deal.createdAt)
      const weekIndex = Math.floor(
        (Date.now() - dealDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )

      if (weekIndex >= 0 && weekIndex < 12) {
        weeks[weekIndex]++
      }
    })

    return weeks
  }
}

