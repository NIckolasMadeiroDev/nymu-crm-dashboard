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
  OperationalDashboardData,
  OperationalMetrics,
  CapacityMetrics,
  PerformanceMetrics,
  ChannelMetrics,
  TagMetrics,
  DailyVolumeData,
} from '@/types/dashboard'
import type { HelenaContact, HelenaCard } from '@/types/helena'
import type { HelenaPanel } from '@/services/helena/helena-panels-service'
import type { CrmDeal } from '@/types/crm'

interface LeadLike {
  id: string
  name: string
  source?: string
  status?: string
  createdAt: string
  updatedAt: string
  college?: string
  tags?: Array<{ id: string; name: string; bgColor?: string; textColor?: string }>
  customFields?: Record<string, any>
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

    // Get all panels with steps using the same method as PanelsManagerModal
    const allPanels = await panelsService.getPanelsWithDetails().catch((error) => {
      const errorMessage = getErrorMessage(error)
      errors.panels = errorMessage
      if (process.env.NODE_ENV === 'development') {
        console.error('[DashboardAdapter] Error fetching panels:', errorMessage)
      }
      return []
    })
    
    // Panels already come with steps from getPanelsWithDetails()
    const panelsWithSteps = allPanels
    
    // Create a map of stepId to step info for quick lookup
    const stepMap = new Map<string, { title: string; isInitial: boolean; isFinal: boolean; panelId: string }>()
    panelsWithSteps.forEach((panel: any) => {
      if (panel.steps && Array.isArray(panel.steps)) {
        panel.steps.forEach((step: any) => {
          if (step.id && !step.archived) {
            stepMap.set(step.id, {
              title: step.title || step.name || '',
              isInitial: step.isInitial || false,
              isFinal: step.isFinal || false,
              panelId: panel.id
            })
          }
        })
      }
    })
    
    // Filter panels if panelId filter is specified
    const panelsToProcess = filters.panelId 
      ? allPanels.filter((panel: any) => panel.id === filters.panelId)
      : allPanels

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Panel filter:', {
        panelId: filters.panelId || 'Todos',
        totalPanels: allPanels.length,
        filteredPanels: panelsToProcess.length,
      })
    }

    // Get cards from filtered panels (sem IncludeDetails pois o endpoint não aceita)
    const cardsPromises = panelsToProcess.map((panel: any) => 
      cardsService.getAllCardsByPanel(panel.id).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[DashboardAdapter] Error fetching cards for panel ${panel.id}:`, error)
        }
        return []
      })
    )
    
    const results = await Promise.allSettled([
      Promise.all(cardsPromises).then(cardsArrays => cardsArrays.flat()).catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.cards = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching cards:', errorMessage)
        }
        return []
      }),
      contactsService.getAllContacts(['tags', 'customFields']).catch((error) => {
        const errorMessage = getErrorMessage(error)
        errors.contacts = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching contacts:', errorMessage)
        }
        return []
      }),
      Promise.resolve(allPanels), // Use the panels we already fetched
      walletsService.getAllWallets().catch((error) => {
        // Wallets are optional, so we don't fail the entire dashboard if they fail
        const errorMessage = getErrorMessage(error)
        errors.wallets = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DashboardAdapter] Warning: Could not fetch wallets (optional):', errorMessage)
        }
        return [] // Return empty array instead of failing
      }),
    ])

    const cards = results[0].status === 'fulfilled' ? results[0].value : []
    const contacts = results[1].status === 'fulfilled' ? results[1].value : []
    const panels = results[2].status === 'fulfilled' ? results[2].value : []
    const wallets = results[3].status === 'fulfilled' ? results[3].value : []
    
    // Store contacts for use in operational metrics
    ;(this as any).contacts = contacts
    
    // Store stepMap and cards for use in other methods
    ;(this as any).stepMap = stepMap
    ;(this as any).panelsWithSteps = panelsWithSteps
    ;(this as any).allCards = cards
    ;(this as any).stepMap = stepMap
    ;(this as any).contacts = contacts

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Fetched:', {
        cards: cards.length,
        cardsArchived: cards.filter((c: any) => c.archived).length,
        cardsActive: cards.filter((c: any) => !c.archived).length,
        contacts: contacts.length,
        panels: panels.length,
        panelsArchived: panels.filter((p: any) => p.archived).length,
        panelsActive: panels.filter((p: any) => !p.archived).length,
        wallets: wallets.length,
        stepMapSize: stepMap.size,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      })
    }

    // Map contacts to leads using real data from cards and tags
    const leads: LeadLike[] = contacts.map((contact) => {
      // Find cards associated with this contact
      const contactCards = cards.filter((card: any) => 
        card.contactIds?.includes(contact.id) || card.contactId === contact.id
      )
      
      // Determine status based on card step - use the most advanced card
      let status: string | undefined = undefined
      if (contactCards.length > 0) {
        // Sort cards by step position to get the most advanced one
        const sortedCards = contactCards.sort((a: any, b: any) => {
          const stepA = stepMap.get(a.stepId || '')
          const stepB = stepMap.get(b.stepId || '')
          // Safely get "position", otherwise default to 0
          const posA = typeof stepA === 'object' && stepA !== null && 'position' in stepA ? (stepA as any).position || 0 : 0
          const posB = typeof stepB === 'object' && stepB !== null && 'position' in stepB ? (stepB as any).position || 0 : 0
          return posB - posA // Higher position = more advanced
        })
        
        const card = sortedCards[0] // Use most advanced card's step
        const stepInfo = stepMap.get(card.stepId || '')
        if (stepInfo) {
          // Map step title to status - more flexible matching
          const stepTitle = stepInfo.title.toLowerCase()
          
          // Check for final steps first
          if (stepInfo.isFinal) {
            if (stepTitle.includes('ganho') || stepTitle.includes('ganho') || stepTitle.includes('cliente ganho') || stepTitle.includes('fechado')) {
              status = 'won'
            } else if (stepTitle.includes('perdido') || stepTitle.includes('cliente perdido') || stepTitle.includes('perda')) {
              status = 'lost'
            }
          }
          
          // If not final, check intermediate steps
          if (!status) {
            if (stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')) {
              status = 'meet_participant'
            } else if (stepTitle.includes('pós-meet') || stepTitle.includes('pos-meet') || stepTitle.includes('pos meet') || stepTitle.includes('pós meet')) {
              status = 'post_meet'
            } else if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo') || stepTitle.includes('no grupo')) {
              status = 'in_group'
            } else if (stepTitle.includes('abordado') || stepTitle.includes('primeiro contato') || stepTitle.includes('contato inicial')) {
              status = 'first_contact'
            } else if (stepTitle.includes('lista') || stepTitle.includes('contato') || stepInfo.isInitial) {
              status = 'contact_list'
            }
          }
        }
      }
      
      // Default to contact_list if no card found
      if (!status) {
        status = 'contact_list'
      }
      
      // Get source from tags or customFields
      const source = contact.tags?.[0]?.name || 
                    contact.customFields?.source as string | undefined ||
                    contact.customFields?.origem as string | undefined ||
                    'Unknown'
      
      // Get college from customFields
      const college = contact.customFields?.college as string | undefined ||
                     contact.customFields?.faculdade as string | undefined ||
                     contact.customFields?.universidade as string | undefined ||
                     undefined
      
      return {
        id: contact.id,
        name: contact.name,
        source,
        status,
        college,
        tags: contact.tags,
        customFields: contact.customFields,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }
    })

    // Convert HelenaCard to CrmDeal format with real data
    // Include cards in final steps that represent closed/won deals
    const deals: CrmDeal[] = cards
      .filter((card: any) => {
        if (card.archived) return false // Exclude archived cards
        const stepInfo = stepMap.get(card.stepId || '')
        if (!stepInfo || !stepInfo.isFinal) return false
        
        // Check if step title indicates a won/completed deal
        const stepTitle = stepInfo.title?.toLowerCase() || ''
        return stepTitle.includes('ganho') || 
               stepTitle.includes('fechado') || 
               stepTitle.includes('concluído') ||
               stepTitle.includes('vendido') ||
               stepTitle.includes('cliente ganho')
      })
      .map((card: any) => ({
        id: card.id,
        title: card.title,
        value: card.monetaryAmount || card.value || 0,
        stageId: card.stepId || card.stageId || '',
        pipelineId: card.panelId || card.pipelineId || '',
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        closedAt: card.closedAt || card.updatedAt,
        owner: card.responsibleUserId || card.ownerId
      }))

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Processing data:', {
        totalLeads: leads.length,
        totalDeals: deals.length,
        totalContacts: contacts.length,
        totalPanels: panels.length,
        totalWallets: wallets.length,
        totalCards: cards.length,
        stepMapSize: stepMap.size,
        sampleSteps: Array.from(stepMap.entries()).slice(0, 5).map(([id, info]) => ({
          id,
          title: info.title,
          isInitial: info.isInitial,
          isFinal: info.isFinal,
        })),
        leadsWithStatus: leads.filter(l => l.status).length,
        leadsStatusBreakdown: {
          contact_list: leads.filter(l => l.status === 'contact_list').length,
          first_contact: leads.filter(l => l.status === 'first_contact').length,
          in_group: leads.filter(l => l.status === 'in_group').length,
          meet_participant: leads.filter(l => l.status === 'meet_participant').length,
          post_meet: leads.filter(l => l.status === 'post_meet').length,
          won: leads.filter(l => l.status === 'won').length,
          lost: leads.filter(l => l.status === 'lost').length,
          undefined: leads.filter(l => !l.status).length,
        },
        cardsWithContactIds: cards.filter((c: any) => c.contactIds && c.contactIds.length > 0).length,
        sampleCard: cards[0] ? {
          id: cards[0].id,
          title: cards[0].title,
          stepId: cards[0].stepId,
          contactIds: cards[0].contactIds,
          stepInfo: cards[0].stepId ? stepMap.get(cards[0].stepId) : null,
        } : null,
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
      // buildLeadQuality usa cards diretamente, não precisa de leads/deals filtrados
      leadQuality: this.buildLeadQuality(leads, deals),
      operational: await this.buildOperationalMetrics(cards, panels, filters),
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
    // Use real card data for more accurate metrics
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    // Filter only active (non-archived) cards
    const activeCards = allCards.filter((card: any) => !card.archived)
    
    // Count cards by step type
    let leadsCreated = activeCards.length
    let leadsInGroup = 0
    let meetParticipants = 0
    
    activeCards.forEach((card: any) => {
      const stepInfo = stepMap.get(card.stepId || '')
      if (stepInfo) {
        const stepTitle = stepInfo.title.toLowerCase()
        
        if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo')) {
          leadsInGroup++
        } else if (stepTitle.includes('meet') || stepTitle.includes('participou')) {
          meetParticipants++
        }
      }
    })
    
    // Fallback to leads if no cards
    if (leadsCreated === 0) {
      leadsCreated = leads.length
      leadsInGroup = leads.filter((lead) => lead.status === 'in_group').length
      meetParticipants = leads.filter((lead) => lead.status === 'meet_participant').length
    }

    // Use cards for weekly grouping if available, otherwise use leads
    const leadsByWeek = activeCards.length > 0 
      ? this.groupCardsByWeek(activeCards)
      : this.groupLeadsByWeek(leads)
      
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
    const revenueGenerated = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    
    // Calculate closing rate based on total active cards vs won cards
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    const activeCards = allCards.filter((card: any) => !card.archived)
    const totalCards = activeCards.length
    const closingRate = totalCards > 0 ? (closedSales / totalCards) * 100 : 0
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
    // Use real card data for more accurate conversion rates
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    // Filter only active (non-archived) cards
    const activeCards = allCards.filter((card: any) => !card.archived)
    
    // Count cards by step type
    let leadsCreated = 0
    let leadsInGroup = 0
    let meetParticipants = 0
    
    activeCards.forEach((card: any) => {
      const stepInfo = stepMap.get(card.stepId || '')
      if (stepInfo) {
        const stepTitle = stepInfo.title.toLowerCase()
        leadsCreated++ // All cards count as created leads
        
        // More flexible matching
        if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo') || stepTitle.includes('no grupo')) {
          leadsInGroup++
        }
        
        if (stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')) {
          meetParticipants++
        }
      } else {
        // Count cards without step info as created
        leadsCreated++
      }
    })
    
    // Also count from leads status
    const leadsInGroupFromStatus = leads.filter((lead) => lead.status === 'in_group' || lead.status === 'meet_participant' || lead.status === 'post_meet').length
    const meetParticipantsFromStatus = leads.filter((lead) => lead.status === 'meet_participant' || lead.status === 'post_meet').length
    
    // Use maximum to ensure we capture all
    leadsInGroup = Math.max(leadsInGroup, leadsInGroupFromStatus)
    meetParticipants = Math.max(meetParticipants, meetParticipantsFromStatus)
    
    // Fallback to leads if no cards
    if (leadsCreated === 0) {
      leadsCreated = leads.length
    }
    
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
    // Use real card data to count leads in each stage with values
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    // Filter only active (non-archived) cards
    const activeCards = allCards.filter((card: any) => !card.archived)
    
    // Helper function to categorize a step
    const categorizeStep = (stepInfo: any, stepTitle: string): 'contactList' | 'firstContact' | 'inGroup' | 'postMeet' | 'other' => {
      if (stepInfo.isInitial || stepTitle.includes('lista') || stepTitle.includes('contato') || stepTitle.includes('novo') || stepTitle.includes('carência')) {
        return 'contactList'
      } else if (stepTitle.includes('abordado') || stepTitle.includes('primeiro contato') || stepTitle.includes('contato inicial')) {
        return 'firstContact'
      } else if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo') || stepTitle.includes('no grupo')) {
        return 'inGroup'
      } else if (stepTitle.includes('pós-meet') || stepTitle.includes('pos-meet') || stepTitle.includes('pos meet') || stepTitle.includes('pós meet') || stepTitle.includes('contato pós-meet')) {
        return 'postMeet'
      }
      return 'other'
    }
    
    // Count cards and values by step
    const cardsByStep = new Map<string, { count: number; value: number; category: string; stepTitle: string }>()
    
    activeCards.forEach((card: any) => {
      const stepId = card.stepId
      if (!stepId) return
      
      const stepInfo = stepMap.get(stepId)
      if (!stepInfo) return
      
      const stepTitle = stepInfo.title?.toLowerCase() || ''
      const category = categorizeStep(stepInfo, stepTitle)
      const value = card.monetaryAmount || card.value || 0
      
      const existing = cardsByStep.get(stepId) || { count: 0, value: 0, category, stepTitle: stepInfo.title || '' }
      existing.count++
      existing.value += value
      cardsByStep.set(stepId, existing)
    })
    
    // Aggregate by category
    let contactList = 0
    let firstContact = 0
    let inGroup = 0
    let postMeet = 0
    let contactListValue = 0
    let firstContactValue = 0
    let inGroupValue = 0
    let postMeetValue = 0
    
    const byStep: Array<{
      stepId: string
      stepTitle: string
      count: number
      value: number
      category: 'contactList' | 'firstContact' | 'inGroup' | 'postMeet' | 'other'
    }> = []
    
    cardsByStep.forEach((data, stepId) => {
      byStep.push({
        stepId,
        stepTitle: data.stepTitle,
        count: data.count,
        value: data.value,
        category: data.category as 'contactList' | 'firstContact' | 'inGroup' | 'postMeet' | 'other',
      })
      
      switch (data.category) {
        case 'contactList':
          contactList += data.count
          contactListValue += data.value
          break
        case 'firstContact':
          firstContact += data.count
          firstContactValue += data.value
          break
        case 'inGroup':
          inGroup += data.count
          inGroupValue += data.value
          break
        case 'postMeet':
          postMeet += data.count
          postMeetValue += data.value
          break
      }
    })
    
    // Sort byStep by count (descending)
    byStep.sort((a, b) => b.count - a.count)
    
    const totalValue = contactListValue + firstContactValue + inGroupValue + postMeetValue
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] buildLeadStock:', {
        contactList,
        firstContact,
        inGroup,
        postMeet,
        contactListValue,
        firstContactValue,
        inGroupValue,
        postMeetValue,
        totalValue,
        totalCards: activeCards.length,
        stepsCount: byStep.length,
      })
    }
    
    return {
      contactList,
      firstContact,
      inGroup,
      postMeet,
      contactListValue,
      firstContactValue,
      inGroupValue,
      postMeetValue,
      totalValue,
      byStep,
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
    // Usar cards diretamente para análise de qualidade dos leads
    const allCards = (this as any).allCards || [] as HelenaCard[]
    const stepMap = (this as any).stepMap || new Map()
    const contacts = (this as any).contacts || []
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] buildLeadQuality - Using cards directly:', {
        totalCards: allCards.length,
        totalDeals: deals.length,
        sampleCard: allCards[0] ? {
          id: allCards[0].id,
          title: allCards[0].title,
          tags: allCards[0].tags,
          monetaryAmount: allCards[0].monetaryAmount,
          stepId: allCards[0].stepId,
        } : null,
      })
    }

    // Função auxiliar para categorizar valor monetário
    const getValueCategory = (value: number | null | undefined): string => {
      if (!value || value === 0) return 'Sem valor'
      if (value >= 500) return 'Alto valor (≥R$500)'
      if (value >= 100) return 'Médio valor (R$100-499)'
      return 'Baixo valor (<R$100)'
    }

    // Função auxiliar para categorizar etapa do funil
    const getFunnelStage = (stepId: string | null | undefined): string => {
      if (!stepId) return 'Sem etapa'
      const stepInfo = stepMap.get(stepId)
      if (!stepInfo) return 'Etapa desconhecida'
      
      if (stepInfo.isFinal) return 'Final (Fechado)'
      if (stepInfo.isInitial) return 'Inicial (Novo)'
      return 'Meio (Em andamento)'
    }

    // Criar um mapa de grupos de cards (leads)
    const groupsMap = new Map<string, HelenaCard[]>()
    
    // Filtrar apenas cards não arquivados
    const activeCards = allCards.filter((card: HelenaCard) => !card.archived)
    
    activeCards.forEach((card: HelenaCard) => {
      let groupKey = 'Sem categoria'
      
      // Prioridade de agrupamento:
      // 1. Tags do card (primeira tag) - maior prioridade
      if (card.tags && card.tags.length > 0 && card.tags[0].name) {
        groupKey = `Tag: ${card.tags[0].name}`
      }
      // 2. Tentar obter informações do contato associado
      else if (card.contactIds && card.contactIds.length > 0) {
        const contact = contacts.find((c: any) => card.contactIds?.includes(c.id))
        if (contact) {
          // Tentar por tag do contato
          if (contact.tags && contact.tags.length > 0 && contact.tags[0].name) {
            groupKey = `Tag: ${contact.tags[0].name}`
          }
          // Tentar por faculdade
          else if (contact.customFields?.college || contact.customFields?.faculdade) {
            groupKey = `Faculdade: ${contact.customFields.college || contact.customFields.faculdade}`
          }
          // Tentar por origem
          else if (contact.customFields?.source || contact.customFields?.origem) {
            groupKey = `Origem: ${contact.customFields.source || contact.customFields.origem}`
          }
        }
      }
      // 3. Valor monetário (se não tem tag ou contato)
      if (groupKey === 'Sem categoria' && card.monetaryAmount && card.monetaryAmount > 0) {
        groupKey = getValueCategory(card.monetaryAmount)
      }
      // 4. Etapa do funil (última opção)
      if (groupKey === 'Sem categoria' && card.stepId) {
        groupKey = getFunnelStage(card.stepId)
      }
      
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, [])
      }
      groupsMap.get(groupKey)!.push(card)
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] buildLeadQuality - Groups:', {
        totalGroups: groupsMap.size,
        groups: Array.from(groupsMap.entries()).map(([key, cards]) => ({
          key,
          count: cards.length,
        })),
      })
    }

    // Calcular métricas para cada grupo
    const qualityData: LeadQuality[] = []
    
    groupsMap.forEach((groupCards, groupKey) => {
      // Cards que participaram de meet (baseado na etapa)
      const meetParticipants = groupCards.filter((card: HelenaCard) => {
        const stepInfo = stepMap.get(card.stepId || '')
        if (!stepInfo) return false
        const stepTitle = stepInfo.title?.toLowerCase() || ''
        return stepTitle.includes('meet') || 
               stepTitle.includes('participou') || 
               stepTitle.includes('participante') ||
               stepInfo.isFinal // Etapas finais também contam como participantes
      }).length
      
      // Encontrar deals (cards fechados) neste grupo
      const groupDeals = groupCards.filter((card: HelenaCard) => {
        const stepInfo = stepMap.get(card.stepId || '')
        if (!stepInfo) return false
        return stepInfo.isFinal && (
          stepInfo.title?.toLowerCase().includes('ganho') ||
          stepInfo.title?.toLowerCase().includes('fechado') ||
          stepInfo.title?.toLowerCase().includes('concluído')
        )
      })
      
      const purchases = groupDeals.length
      const totalLeads = groupCards.length
      
      // Taxa de participação em meet (baseado em progresso no funil)
      const meetParticipationRate = totalLeads > 0 
        ? (meetParticipants / totalLeads) * 100 
        : 0
      
      // Taxa de compra (de participantes para compradores)
      const purchaseRate = meetParticipants > 0 
        ? (purchases / meetParticipants) * 100 
        : 0

      // Só adicionar grupos com pelo menos alguns cards
      if (totalLeads > 0) {
        // Criar displayOrigin removendo prefixos para exibição mais limpa
        let displayOrigin = groupKey
        if (groupKey.startsWith('Tag: ')) {
          displayOrigin = groupKey.replace('Tag: ', '')
        } else if (groupKey.startsWith('Faculdade: ')) {
          displayOrigin = groupKey.replace('Faculdade: ', '')
        } else if (groupKey.startsWith('Origem: ')) {
          displayOrigin = groupKey.replace('Origem: ', '')
        }
        
        qualityData.push({
          origin: displayOrigin,
          meetParticipationRate: Math.round(meetParticipationRate * 100) / 100,
          purchaseRate: Math.round(purchaseRate * 100) / 100,
        })
      }
    })

    // Ordenar por número de leads (maior primeiro), depois por taxa de conversão
    return qualityData.sort((a, b) => {
      const aLeads = groupsMap.get(a.origin)?.length || 0
      const bLeads = groupsMap.get(b.origin)?.length || 0
      if (aLeads !== bLeads) {
        return bLeads - aLeads
      }
      return b.purchaseRate - a.purchaseRate
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

  private groupCardsByWeek(cards: any[]): number[] {
    const weeks: number[] = new Array(12).fill(0)

    cards.forEach((card) => {
      const cardDate = new Date(card.createdAt)
      const weekIndex = Math.floor(
        (Date.now() - cardDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )

      if (weekIndex >= 0 && weekIndex < 12) {
        weeks[weekIndex]++
      }
    })

    return weeks
  }

  private async buildOperationalMetrics(
    cards: HelenaCard[],
    panels: HelenaPanel[],
    filters: DashboardFilters
  ): Promise<OperationalDashboardData> {
    const stepMap = (this as any).stepMap as Map<string, any>
    const periodDate = new Date(filters.date)
    periodDate.setHours(0, 0, 0, 0)
    const periodStart = periodDate.getTime()
    const periodEnd = periodDate.getTime() + 24 * 60 * 60 * 1000 // End of day

    // Helper to check if card is in non-final step (pending) - use stepMap
    const isPending = (card: HelenaCard): boolean => {
      if (card.archived) return false
      const stepInfo = stepMap.get(card.stepId || '')
      return stepInfo && !stepInfo.isFinal
    }

    // Helper to check if card is completed (in final step) - use stepMap
    const isCompleted = (card: HelenaCard): boolean => {
      if (card.archived) return false
      const stepInfo = stepMap.get(card.stepId || '')
      return stepInfo && stepInfo.isFinal
    }

    // Cards created before period
    const pendingBeforePeriod = cards.filter(
      card => card.createdAt && new Date(card.createdAt).getTime() < periodStart && isPending(card)
    ).length

    // Cards created in period
    const newInPeriod = cards.filter(
      card => {
        const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
        return createdAt >= periodStart && createdAt < periodEnd
      }
    ).length

    // Cards completed in period
    const completedInPeriod = cards.filter(
      card => {
        const updatedAt = card.updatedAt ? new Date(card.updatedAt).getTime() : 0
        return updatedAt >= periodStart && updatedAt < periodEnd && isCompleted(card)
      }
    ).length

    // Cards pending after period
    const pendingAfterPeriod = cards.filter(
      card => {
        const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
        return createdAt < periodEnd && isPending(card)
      }
    ).length

    // Calculate capacity metrics
    const daysInPeriod = 1 // For single day period, adjust if needed
    const capacity: CapacityMetrics = {
      new: {
        total: newInPeriod,
        averagePerDay: daysInPeriod > 0 ? Number((newInPeriod / daysInPeriod).toFixed(1)) : 0,
      },
      completed: {
        total: completedInPeriod,
        averagePerDay: daysInPeriod > 0 ? Number((completedInPeriod / daysInPeriod).toFixed(1)) : 0,
      },
      performance: newInPeriod > 0 ? Number((completedInPeriod / newInPeriod).toFixed(2)) : 0,
    }

    // Calculate performance metrics (wait time and duration)
    const performance = this.buildPerformanceMetrics(cards, panels, filters)

    // Calculate channel metrics
    const contacts = (this as any).contacts || []
    const channels = await this.buildChannelMetrics(cards, contacts)

    // Calculate tag metrics
    const topTags = this.buildTagMetrics(cards)

    // Calculate daily volume
    const dailyVolume = this.buildDailyVolume(cards, filters)

    return {
      operational: {
        pendingBeforePeriod,
        newInPeriod,
        completedInPeriod,
        pendingAfterPeriod,
      },
      capacity,
      performance,
      channels,
      topTags,
      dailyVolume,
    }
  }

  private buildPerformanceMetrics(
    cards: HelenaCard[],
    panels: HelenaPanel[],
    filters: DashboardFilters
  ): PerformanceMetrics {
    const periodDate = new Date(filters.date)
    periodDate.setHours(0, 0, 0, 0)
    const periodStart = periodDate.getTime()
    const periodEnd = periodDate.getTime() + 24 * 60 * 60 * 1000

    // Get cards that were created in period and have user interaction
    const cardsWithInteraction = cards.filter(card => {
      const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
      return createdAt >= periodStart && createdAt < periodEnd && card.responsibleUserId
    })

    // Calculate wait time (time from creation to first non-initial step)
    const waitTimes: number[] = []
    cardsWithInteraction.forEach(card => {
      // For now, use updatedAt - createdAt as approximation
      // In a real scenario, you'd check notes to find when card moved to first non-initial step
      if (card.createdAt && card.updatedAt) {
        const created = new Date(card.createdAt).getTime()
        const updated = new Date(card.updatedAt).getTime()
        const waitMinutes = (updated - created) / (60 * 1000)
        if (waitMinutes > 0 && waitMinutes < 24 * 60) { // Reasonable wait time
          waitTimes.push(waitMinutes)
        }
      }
    })

    const avgWaitMinutes = waitTimes.length > 0
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
      : 0

    // Calculate duration (time from creation to completion)
    const durations: number[] = []
    cards.forEach(card => {
      const panel = panels.find(p => p.id === card.panelId)
      if (!panel?.steps) return
      const step = panel.steps.find((s: any) => s.id === card.stepId)
      
      if (step && step.isFinal && card.createdAt && card.updatedAt) {
        const created = new Date(card.createdAt).getTime()
        const updated = new Date(card.updatedAt).getTime()
        const durationHours = (updated - created) / (60 * 60 * 1000)
        if (durationHours > 0 && durationHours < 365 * 24) { // Reasonable duration
          durations.push(durationHours)
        }
      }
    })

    const avgDurationHours = durations.length > 0
      ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length
      : 0

    return {
      waitTime: {
        averageMinutes: Math.floor(avgWaitMinutes),
        averageSeconds: Math.round((avgWaitMinutes % 1) * 60),
        formatted: `${Math.floor(avgWaitMinutes)} min ${Math.round((avgWaitMinutes % 1) * 60)} seg`,
        consideredCount: waitTimes.length,
        trend: 'stable', // Could be calculated based on previous periods
      },
      duration: {
        averageHours: Math.floor(avgDurationHours),
        averageMinutes: Math.round((avgDurationHours % 1) * 60),
        formatted: `${Math.floor(avgDurationHours)}h ${Math.round((avgDurationHours % 1) * 60)}min`,
        consideredCount: durations.length,
        trend: 'stable', // Could be calculated based on previous periods
      },
    }
  }

  private async buildChannelMetrics(cards: HelenaCard[], contacts?: HelenaContact[]): Promise<ChannelMetrics[]> {
    const allContacts = contacts || (this as any).contacts || []
    const channelMap = new Map<string, number>()

    // Buscar departments com canais
    let departmentsWithChannels: any[] = []
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      const allDepartments = await departmentsService.listDepartments()
      // Buscar detalhes de cada department para obter canais
      departmentsWithChannels = await Promise.all(
        allDepartments.map(async (dept) => {
          try {
            const details = await departmentsService.getDepartmentById(dept.id, 'All')
            return details
          } catch {
            return dept
          }
        })
      )
    } catch (error) {
      console.warn('[DashboardAdapter] Error fetching departments for channels:', error)
    }

    // Criar mapa de channelId -> channelName
    const channelIdToName = new Map<string, string>()
    departmentsWithChannels.forEach((dept) => {
      if (dept.channels && Array.isArray(dept.channels)) {
        dept.channels.forEach((channel: any) => {
          if (channel.id) {
            const channelName = channel.name || channel.number || `Canal ${channel.id.substring(0, 8)}`
            channelIdToName.set(channel.id, channelName)
          }
        })
      }
    })

    cards.forEach(card => {
      let channelFound = false

      // Tentar encontrar canal através de sessionId ou metadata
      if (card.sessionId) {
        // sessionId pode estar relacionado ao canal
        // Verificar se há alguma relação no metadata
        if (card.metadata && typeof card.metadata === 'object') {
          const metadata = card.metadata as any
          if (metadata.channelId && channelIdToName.has(metadata.channelId)) {
            const channelName = channelIdToName.get(metadata.channelId)!
            const count = channelMap.get(channelName) || 0
            channelMap.set(channelName, count + 1)
            channelFound = true
          }
        }
      }

      // Se não encontrou por sessionId, tentar por tags (canais podem estar como tags)
      if (!channelFound && card.tags && card.tags.length > 0) {
        card.tags.forEach(tag => {
          // Verificar se o nome da tag corresponde a algum canal conhecido
          const matchingChannel = Array.from(channelIdToName.values()).find(
            name => name.toLowerCase().includes(tag.name.toLowerCase()) || 
                   tag.name.toLowerCase().includes(name.toLowerCase())
          )
          if (matchingChannel) {
            const count = channelMap.get(matchingChannel) || 0
            channelMap.set(matchingChannel, count + 1)
            channelFound = true
          } else {
            // Usar tag como canal se não encontrar correspondência
            const count = channelMap.get(tag.name) || 0
            channelMap.set(tag.name, count + 1)
            channelFound = true
          }
        })
      }

      // Se ainda não encontrou, tentar por contact source
      if (!channelFound && card.contactIds && card.contactIds.length > 0) {
        const contact = allContacts.find((c: { id: string }) => card.contactIds?.includes(c.id))
        if (contact?.customFields?.source) {
          const source = contact.customFields.source as string
          const count = channelMap.get(source) || 0
          channelMap.set(source, count + 1)
          channelFound = true
        }
      }

      // Se não encontrou nenhum canal, marcar como "Sem canal"
      if (!channelFound) {
        const count = channelMap.get('Sem canal') || 0
        channelMap.set('Sem canal', count + 1)
      }
    })

    return Array.from(channelMap.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
  }

  private buildTagMetrics(cards: HelenaCard[]): TagMetrics[] {
    const tagMap = new Map<string, { count: number; bgColor?: string; textColor?: string }>()

    cards.forEach(card => {
      if (card.tags && card.tags.length > 0) {
        card.tags.forEach(tag => {
          const existing = tagMap.get(tag.id) || { count: 0, bgColor: tag.bgColor, textColor: tag.textColor }
          existing.count++
          tagMap.set(tag.id, existing)
        })
      }
    })

    return Array.from(tagMap.entries())
      .map(([tagId, data]) => {
        // Find tag name from cards
        const cardWithTag = cards.find(c => c.tags?.some(t => t.id === tagId))
        const tagName = cardWithTag?.tags?.find(t => t.id === tagId)?.name || 'Sem nome'
        
        return {
          tagId,
          tagName,
          count: data.count,
          bgColor: data.bgColor,
          textColor: data.textColor,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50) // Top 50 tags
  }

  private buildDailyVolume(cards: HelenaCard[], filters: DashboardFilters): DailyVolumeData[] {
    const periodDate = new Date(filters.date)
    periodDate.setHours(0, 0, 0, 0)
    const periodStart = periodDate.getTime()
    const periodEnd = periodDate.getTime() + 24 * 60 * 60 * 1000

    // Group cards by day within the period
    const dailyMap = new Map<string, number>()

    cards.forEach(card => {
      if (card.createdAt) {
        const created = new Date(card.createdAt)
        const createdTime = created.getTime()
        
        if (createdTime >= periodStart && createdTime < periodEnd) {
          const dateKey = created.toISOString().split('T')[0]
          const count = dailyMap.get(dateKey) || 0
          dailyMap.set(dateKey, count + 1)
        }
      }
    })

    return Array.from(dailyMap.entries())
      .map(([date, count]) => ({
        date,
        count,
        label: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}

