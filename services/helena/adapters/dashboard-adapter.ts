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
import { requestDeduplicator } from './request-deduplicator'

export class DashboardAdapter {
  private getErrorMessage(error: unknown): string {
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

  private async fetchPanels(panelsService: any, errors: any): Promise<any[]> {
    const result = await requestDeduplicator.execute(
      'getPanelsWithDetails',
      () => panelsService.getPanelsWithDetails(),
      2000
    ).catch((error: unknown) => {
      const errorMessage = this.getErrorMessage(error)
      errors.panels = errorMessage
      if (process.env.NODE_ENV === 'development') {
        console.error('[DashboardAdapter] Error fetching panels:', errorMessage)
      }
      return []
    })
    return Array.isArray(result) ? result : []
  }

  private createStepMap(panelsWithSteps: any[]): Map<string, { title: string; isInitial: boolean; isFinal: boolean; panelId: string }> {
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
    return stepMap
  }

  private async fetchData(cardsService: any, contactsService: any, walletsService: any, panelsToProcess: any[], allPanels: any[], errors: any): Promise<[any[], any[], any[], any[]]> {
    const cardsPromises = panelsToProcess.map((panel: any) => 
      cardsService.getAllCardsByPanel(panel.id).catch((error: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[DashboardAdapter] Error fetching cards for panel ${panel.id}:`, error)
        }
        return []
      })
    )
    
    const results = await Promise.allSettled([
      Promise.all(cardsPromises).then(cardsArrays => cardsArrays.flat()).catch((error: unknown) => {
        const errorMessage = this.getErrorMessage(error)
        errors.cards = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching cards:', errorMessage)
        }
        return []
      }),
      requestDeduplicator.execute(
        'getAllContacts',
        () => contactsService.getAllContacts(['tags', 'customFields']),
        2000
      ).catch((error: unknown) => {
        const errorMessage = this.getErrorMessage(error)
        errors.contacts = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error('[DashboardAdapter] Error fetching contacts:', errorMessage)
        }
        return []
      }),
      Promise.resolve(allPanels),
      walletsService.getAllWallets().catch((error: unknown) => {
        const errorMessage = this.getErrorMessage(error)
        errors.wallets = errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DashboardAdapter] Warning: Could not fetch wallets (optional):', errorMessage)
        }
        return []
      }),
    ])

    const cards = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : []
    const contacts = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : []
    const panels = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : []
    const wallets = results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : []
    
    return [cards, contacts, panels, wallets]
  }

  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    this.logDebug('Fetching data from Helena API...')

    const services = this.initializeServices()
    const errors = this.initializeErrors()
    
    const { allPanels, panelsToProcess, stepMap } = await this.preparePanels(services.panelsService, filters, errors)
    const { cards, contacts, panels, wallets } = await this.fetchAllData(services, panelsToProcess, allPanels, errors)
    
    this.storeContextData(contacts, stepMap, allPanels, cards)
    this.logFetchedData(cards, contacts, panels, wallets, stepMap, errors)

    const { leads, deals } = this.processData(contacts, cards, stepMap)
    this.logProcessedData(leads, deals, contacts, panels, wallets, cards, stepMap)

    const { filteredLeads, filteredDeals, filteredContacts } = this.applyFilters(leads, deals, contacts, filters)
    this.logFilteredData(filteredLeads, filteredDeals, filteredContacts)

    const { dealsData, leadsData } = this.prepareDataStructures(filteredDeals, cards)

    return await this.buildDashboardDataStructure({
      filteredLeads,
      filteredDeals,
      filteredContacts,
      cards,
      dealsData,
      leadsData,
      filters,
      panels,
      errors,
    })
  }

  private initializeServices() {
    return {
      cardsService: helenaServiceFactory.getCardsService(),
      contactsService: helenaServiceFactory.getContactsService(),
      panelsService: helenaServiceFactory.getPanelsService(),
      walletsService: helenaServiceFactory.getWalletsService(),
    }
  }

  private initializeErrors() {
    return {
      cards: undefined as string | undefined,
      contacts: undefined as string | undefined,
      panels: undefined as string | undefined,
      wallets: undefined as string | undefined,
    }
  }

  private async preparePanels(panelsService: any, filters: DashboardFilters, errors: any) {
    const allPanels = await this.fetchPanels(panelsService, errors)
    const stepMap = this.createStepMap(allPanels)
    const panelsToProcess = filters.panelIds && filters.panelIds.length > 0
      ? allPanels.filter((panel: any) => filters.panelIds!.includes(panel.id))
      : allPanels

    this.logPanelFilter(filters, allPanels, panelsToProcess)

    return { allPanels, panelsToProcess, stepMap }
  }

  private async fetchAllData(services: any, panelsToProcess: any[], allPanels: any[], errors: any) {
    this.logDebug('Fetching cards, contacts, panels, and wallets...')
    const [cards, contacts, panels, wallets] = await this.fetchData(
      services.cardsService,
      services.contactsService,
      services.walletsService,
      panelsToProcess,
      allPanels,
      errors
    )
    return { cards, contacts, panels, wallets }
  }

  private storeContextData(contacts: any[], stepMap: Map<string, any>, allPanels: any[], cards: any[]) {
    ;(this as any).contacts = contacts
    ;(this as any).stepMap = stepMap
    ;(this as any).panelsWithSteps = allPanels
    ;(this as any).allCards = cards
    ;(this as any).allPanels = allPanels
  }

  private processData(contacts: any[], cards: any[], stepMap: Map<string, any>) {
    const leads = this.processLeadsFromContacts(contacts, cards, stepMap)
    const deals = this.processDealsFromCards(cards, stepMap)
    return { leads, deals }
  }

  private applyFilters(leads: LeadLike[], deals: CrmDeal[], contacts: any[], filters: DashboardFilters) {
    return {
      filteredLeads: this.filterLeads(leads, filters),
      filteredDeals: this.filterDeals(deals, filters),
      filteredContacts: this.filterContacts(contacts, filters),
    }
  }

  private prepareDataStructures(filteredDeals: CrmDeal[], cards: any[]) {
    const dealsData = filteredDeals.map((deal) => ({
      id: deal.id,
      title: deal.title || '',
      value: deal.value || 0,
      stageId: deal.stageId || '',
      pipelineId: deal.pipelineId || '',
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      closedAt: deal.closedAt,
      owner: deal.owner || '',
      contactIds: deal.contactIds || [],
    }))

    const leadsData = cards
      .filter((card: any) => !card.archived)
      .map((card: any) => ({
        id: card.id,
        title: card.title || '',
        value: card.monetaryAmount || card.value || 0,
        stageId: card.stepId || card.stageId || '',
        pipelineId: card.panelId || card.pipelineId || '',
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        owner: card.responsibleUserId || card.ownerId || '',
        contactIds: card.contactIds || [],
      }))

    return { dealsData, leadsData }
  }

  private logDebug(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DashboardAdapter] ${message}`)
    }
  }

  private logPanelFilter(filters: DashboardFilters, allPanels: any[], panelsToProcess: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Panel filter:', {
        panelIds: filters.panelIds?.length ? filters.panelIds : 'Todos',
        totalPanels: allPanels.length,
        filteredPanels: panelsToProcess.length,
      })
    }
  }

  private logFetchedData(cards: any[], contacts: any[], panels: any[], wallets: any[], stepMap: Map<string, any>, errors: any) {
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
  }

  private logProcessedData(leads: LeadLike[], deals: CrmDeal[], contacts: any[], panels: any[], wallets: any[], cards: any[], stepMap: Map<string, any>) {
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
  }

  private logFilteredData(filteredLeads: LeadLike[], filteredDeals: CrmDeal[], filteredContacts: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] Filtered data:', {
        filteredLeads: filteredLeads.length,
        filteredDeals: filteredDeals.length,
        filteredContacts: filteredContacts.length,
      })
    }
  }

  private processLeadsFromContacts(contacts: any[], cards: any[], stepMap: Map<string, any>): LeadLike[] {
    const getStepPosition = (stepInfo: any): number => {
      return typeof stepInfo === 'object' && stepInfo !== null && 'position' in stepInfo
        ? stepInfo.position || 0
        : 0
    }

    const determineStatusFromStep = (stepInfo: any): string => {
      if (!stepInfo) return 'contact_list'
      
      const stepTitle = stepInfo.title.toLowerCase()
      
      if (stepInfo.isFinal) {
        if (stepTitle.includes('ganho') || stepTitle.includes('cliente ganho') || stepTitle.includes('fechado')) {
          return 'won'
        }
        if (stepTitle.includes('perdido') || stepTitle.includes('cliente perdido') || stepTitle.includes('perda')) {
          return 'lost'
        }
      }
      
      if (stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')) {
        return 'meet_participant'
      }
      if (stepTitle.includes('pós-meet') || stepTitle.includes('pos-meet') || stepTitle.includes('pos meet') || stepTitle.includes('pós meet')) {
        return 'post_meet'
      }
      if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo') || stepTitle.includes('no grupo')) {
        return 'in_group'
      }
      if (stepTitle.includes('abordado') || stepTitle.includes('primeiro contato') || stepTitle.includes('contato inicial')) {
        return 'first_contact'
      }
      if (stepTitle.includes('lista') || stepTitle.includes('contato') || stepInfo.isInitial) {
        return 'contact_list'
      }
      
      return 'contact_list'
    }

    const getContactSource = (contact: any): string => {
      return contact.tags?.[0]?.name || 
             contact.customFields?.source as string | undefined ||
             contact.customFields?.origem as string | undefined ||
             'Unknown'
    }

    const getContactCollege = (contact: any): string | undefined => {
      return contact.customFields?.college as string | undefined ||
             contact.customFields?.faculdade as string | undefined ||
             contact.customFields?.universidade as string | undefined ||
             undefined
    }

    return contacts.map((contact) => {
      const contactCards = cards.filter((card: any) => 
        card.contactIds?.includes(contact.id) || card.contactId === contact.id
      )
      
      let status = 'contact_list'
      if (contactCards.length > 0) {
        const sortedCards = [...contactCards].sort((a: any, b: any) => {
          const stepA = stepMap.get(a.stepId || '')
          const stepB = stepMap.get(b.stepId || '')
          const posA = getStepPosition(stepA)
          const posB = getStepPosition(stepB)
          return posB - posA
        })
        
        const card = sortedCards[0]
        const stepInfo = stepMap.get(card.stepId || '')
        status = determineStatusFromStep(stepInfo)
      }
      
      return {
        id: contact.id,
        name: contact.name,
        source: getContactSource(contact),
        status,
        college: getContactCollege(contact),
        tags: contact.tags,
        customFields: contact.customFields,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }
    })
  }

  private processDealsFromCards(cards: any[], stepMap: Map<string, any>): CrmDeal[] {
    return cards
      .filter((card: any) => {
        if (card.archived) return false
        const stepInfo = stepMap.get(card.stepId || '')
        if (!stepInfo?.isFinal) return false
        
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
        owner: card.responsibleUserId || card.ownerId,
        contactIds: card.contactIds || []
      }))
  }

  private async buildDashboardDataStructure(params: {
    filteredLeads: LeadLike[]
    filteredDeals: CrmDeal[]
    filteredContacts: any[]
    cards: any[]
    dealsData: any[]
    leadsData: any[]
    filters: DashboardFilters
    panels: any[]
    errors: any
  }): Promise<DashboardData> {
    const { filteredLeads, filteredDeals, filteredContacts, cards, dealsData, leadsData, filters, panels, errors } = params
    const contactIds = new Set<string>()
    dealsData      .forEach((deal) => {
      if (deal.contactIds && Array.isArray(deal.contactIds)) {
        deal.contactIds.forEach((id: string) => contactIds.add(id))
      }
    })
    leadsData.forEach((lead) => {
      if (lead.contactIds && Array.isArray(lead.contactIds)) {
        lead.contactIds.forEach((id: string) => contactIds.add(id))
      }
    })

    const contactsData = filteredContacts
      .filter((contact) => contactIds.has(contact.id))
      .map((contact) => ({
        id: contact.id,
        name: contact.name || '',
        email: contact.email ?? undefined,
        phoneNumber: contact.phoneNumber || '',
        phone: contact.phoneNumber || '',
        phoneNumberFormatted: contact.phoneNumberFormatted || contact.phoneNumber || '',
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        companyId: contact.companyId,
        status: contact.status || 'active',
        tags: contact.tags || [],
        customFields: contact.customFields || {},
      }))

    const userIds = new Set<string>()
    dealsData.forEach((deal) => {
      if (deal.owner) userIds.add(deal.owner)
    })
    leadsData.forEach((lead) => {
      if (lead.owner) userIds.add(lead.owner)
    })

    const usersData: Array<{ id: string; name: string; email?: string }> = []
    try {
      const { helenaServiceFactory } = await import('../helena-service-factory')
      const usersService = helenaServiceFactory.getUsersService()
      const allUsers = await usersService.getAllUsers()
      usersData.push(
        ...allUsers
          .filter((u: any) => userIds.has(u.id))
          .map((u: any) => ({
            id: u.id,
            name: u.name || '',
            email: u.email,
          }))
      )
    } catch (error) {
      console.error('Error fetching users for dashboard data:', error)
    }

    const cardsData = cards
      .filter((card: any) => !card.archived)
      .map((card: any) => ({
        id: card.id,
        title: card.title || '',
        panelId: card.panelId || '',
        stepId: card.stepId || '',
        contactIds: card.contactIds || [],
        createdAt: card.createdAt || '',
        updatedAt: card.updatedAt || '',
        responsibleUserId: card.responsibleUserId,
        monetaryAmount: card.monetaryAmount || 0,
        archived: card.archived || false,
      }))

    return {
      filters,
      generationActivation: await this.buildGenerationActivation(filteredLeads, filteredContacts),
      salesConversion: await this.buildSalesConversion(filteredDeals),
      conversionRates: this.buildConversionRates(filteredLeads, filteredDeals),
      leadStock: this.buildLeadStock(filteredLeads, filteredContacts),
      salesByConversionTime: this.buildSalesByConversionTime(filteredDeals),
      leadQuality: this.buildLeadQuality(filteredLeads, filteredDeals, filters),
      operational: await this.buildOperationalMetrics(cards, panels, filters),
      deals: dealsData,
      contacts: contactsData,
      users: usersData,
      cards: cardsData,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    }
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

  private async buildGenerationActivation(
    leads: LeadLike[],
    contacts: HelenaContact[]
  ): Promise<GenerationActivationMetrics> {
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    const activeCards = allCards.filter((card: any) => !card.archived)
    
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
    
    if (leadsCreated === 0) {
      leadsCreated = leads.length
      leadsInGroup = leads.filter((lead) => lead.status === 'in_group').length
      meetParticipants = leads.filter((lead) => lead.status === 'meet_participant').length
    }

    const leadsByWeek = activeCards.length > 0 
      ? this.groupCardsByWeek(activeCards)
      : this.groupLeadsByWeek(leads)
      
    const { getWeekDateRange, formatDateRange } = await import('@/utils/date-ranges')
    
    const leadsCreatedByWeek: WeeklyData[] = leadsByWeek.map((count, index) => {
      const weekNumber = 12 - index
      const { startDate, endDate } = getWeekDateRange(weekNumber)
      const dateRange = formatDateRange(startDate, endDate)
      return {
        week: weekNumber,
        value: count,
        label: `Sem ${weekNumber}: ${dateRange}`,
      }
    })

    return {
      leadsCreated,
      leadsInGroup,
      meetParticipants,
      leadsCreatedByWeek,
    }
  }

  private async buildSalesConversion(deals: CrmDeal[]): Promise<SalesConversionMetrics> {
    const closedSales = deals.length
    const revenueGenerated = deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    
    const allCards = (this as any).allCards || []
    const activeCards = allCards.filter((card: any) => !card.archived)
    const totalCards = activeCards.length
    const closingRate = totalCards > 0 ? (closedSales / totalCards) * 100 : 0
    const targetRate = 75

    const salesByWeek = this.groupDealsByWeek(deals)
    const { getWeekDateRange, formatDateRange } = await import('@/utils/date-ranges')
    
    const salesByWeekData: WeeklyData[] = salesByWeek.map((count, index) => {
      const weekNumber = 12 - index
      const { startDate, endDate } = getWeekDateRange(weekNumber)
      const dateRange = formatDateRange(startDate, endDate)
      return {
        week: weekNumber,
        value: count,
        label: `Sem ${weekNumber}: ${dateRange}`,
      }
    })

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
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    const activeCards = allCards.filter((card: any) => !card.archived)
    
    let leadsCreated = 0
    let leadsInGroup = 0
    let meetParticipants = 0
    
    activeCards.forEach((card: any) => {
      const stepInfo = stepMap.get(card.stepId || '')
      if (stepInfo) {
        const stepTitle = stepInfo.title.toLowerCase()
        leadsCreated++
        
        if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo') || stepTitle.includes('no grupo')) {
          leadsInGroup++
        }
        
        if (stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')) {
          meetParticipants++
        }
      } else {
        leadsCreated++
      }
    })
    
    const leadsInGroupFromStatus = leads.filter((lead) => lead.status === 'in_group' || lead.status === 'meet_participant' || lead.status === 'post_meet').length
    const meetParticipantsFromStatus = leads.filter((lead) => lead.status === 'meet_participant' || lead.status === 'post_meet').length
    
    leadsInGroup = Math.max(leadsInGroup, leadsInGroupFromStatus)
    meetParticipants = Math.max(meetParticipants, meetParticipantsFromStatus)
    
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
    const stepMap = (this as any).stepMap as Map<string, any>
    const allCards = (this as any).allCards || []
    
    const activeCards = allCards.filter((card: any) => !card.archived)
    
    type StepCategory = 'contactList' | 'firstContact' | 'inGroup' | 'postMeet' | 'other'
    type ByStepItem = {
      stepId: string
      stepTitle: string
      count: number
      value: number
      category: StepCategory
    }
    
    const categorizeStep = (stepInfo: any, stepTitle: string): StepCategory => {
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
    
    let contactList = 0
    let firstContact = 0
    let inGroup = 0
    let postMeet = 0
    let contactListValue = 0
    let firstContactValue = 0
    let inGroupValue = 0
    let postMeetValue = 0
    
    const byStep: ByStepItem[] = []
    
    cardsByStep.forEach((data, stepId) => {
      byStep.push({
        stepId,
        stepTitle: data.stepTitle,
        count: data.count,
        value: data.value,
        category: data.category as StepCategory,
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

  private buildLeadQuality(leads: LeadLike[], deals: CrmDeal[], filters: DashboardFilters): LeadQuality[] {
    const allCards = (this as any).allCards || [] as HelenaCard[]
    const allPanels = (this as any).allPanels || []
    
    const filteredPanels = filters.panelIds && filters.panelIds.length > 0
      ? allPanels.filter((panel: any) => filters.panelIds!.includes(panel.id))
      : allPanels
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DashboardAdapter] buildLeadQuality - Using cards directly:', {
        totalCards: allCards.length,
        totalDeals: deals.length,
        filteredPanels: filteredPanels.length,
        panelIds: filters.panelIds || 'Todos',
        sampleCard: allCards[0] ? {
          id: allCards[0].id,
          title: allCards[0].title,
          panelId: allCards[0].panelId,
          stepId: allCards[0].stepId,
        } : null,
      })
    }

    const panelMap = new Map<string, { key: string; title: string }>()
    filteredPanels.forEach((panel: any) => {
      if (panel.id) {
        panelMap.set(panel.id, {
          key: panel.key || panel.id,
          title: panel.title || 'Painel Desconhecido',
        })
      }
    })

    const groupsMap = new Map<string, HelenaCard[]>()
    
    const filteredPanelIds = new Set(filteredPanels.map((p: any) => p.id))
    const activeCards = allCards.filter((card: HelenaCard) => {
      if (card.archived) return false
      const panelId = card.panelId || card.pipelineId || ''
      return filteredPanelIds.has(panelId)
    })
    
    const filteredStepMap = new Map<string, { title: string; isInitial: boolean; isFinal: boolean; panelId: string }>()
    filteredPanels.forEach((panel: any) => {
      if (panel.steps && Array.isArray(panel.steps)) {
        panel.steps.forEach((step: any) => {
          if (step.id && !step.archived) {
            filteredStepMap.set(step.id, {
              title: step.title || step.name || '',
              isInitial: step.isInitial || false,
              isFinal: step.isFinal || false,
              panelId: panel.id
            })
          }
        })
      }
    })

    activeCards.forEach((card: HelenaCard) => {
      const panelId = card.panelId || card.pipelineId || ''
      const stepId = card.stepId || card.stageId || ''
      
      const stepInfo = filteredStepMap.get(stepId)
      const panelInfo = panelMap.get(panelId)
      
      if (!panelInfo) {
        return
      }
      
      let groupKey = 'Sem categoria'
      
      if (panelInfo && stepInfo) {
        const panelLabel = panelInfo.key ? `Painel ${panelInfo.key}` : panelInfo.title
        const stepTitle = stepInfo.title || 'Sem etapa'
        groupKey = `${panelLabel} - ${stepTitle}`
      } else if (panelInfo && !stepInfo) {
        const panelLabel = panelInfo.key ? `Painel ${panelInfo.key}` : panelInfo.title
        groupKey = `${panelLabel} - Sem etapa`
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

    const qualityData: LeadQuality[] = []
    
    const totalAllLeads = activeCards.length
    
    groupsMap.forEach((groupCards, groupKey) => {
      const totalLeads = groupCards.length
      
      const percentageOfTotal = totalAllLeads > 0 
        ? (totalLeads / totalAllLeads) * 100 
        : 0

      if (totalLeads > 0) {
        qualityData.push({
          origin: groupKey,
          totalLeads,
          percentageOfTotal: Math.round(percentageOfTotal * 100) / 100,
        })
      }
    })

    return qualityData.sort((a, b) => {
      if (a.totalLeads !== b.totalLeads) {
        return b.totalLeads - a.totalLeads
      }
      return b.percentageOfTotal - a.percentageOfTotal
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
    const periodEnd = periodDate.getTime() + 24 * 60 * 60 * 1000

    const isPending = (card: HelenaCard): boolean => {
      if (card.archived) return false
      const stepInfo = stepMap.get(card.stepId || '')
      return stepInfo && !stepInfo.isFinal
    }

    const isCompleted = (card: HelenaCard): boolean => {
      if (card.archived) return false
      const stepInfo = stepMap.get(card.stepId || '')
      return stepInfo?.isFinal ?? false
    }

    const pendingBeforePeriod = cards.filter(
      card => card.createdAt && new Date(card.createdAt).getTime() < periodStart && isPending(card)
    ).length

    const newInPeriod = cards.filter(
      card => {
        const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
        return createdAt >= periodStart && createdAt < periodEnd
      }
    ).length

    const completedInPeriod = cards.filter(
      card => {
        const updatedAt = card.updatedAt ? new Date(card.updatedAt).getTime() : 0
        return updatedAt >= periodStart && updatedAt < periodEnd && isCompleted(card)
      }
    ).length

    const pendingAfterPeriod = cards.filter(
      card => {
        const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
        return createdAt < periodEnd && isPending(card)
      }
    ).length

    const daysInPeriod = 1
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

    const performance = this.buildPerformanceMetrics(cards, panels, filters)

    const contacts = (this as any).contacts || []
    const channels = await this.buildChannelMetrics(cards, contacts)

    const topTags = this.buildTagMetrics(cards)

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

    const cardsWithInteraction = cards.filter(card => {
      const createdAt = card.createdAt ? new Date(card.createdAt).getTime() : 0
      return createdAt >= periodStart && createdAt < periodEnd && card.responsibleUserId
    })

    const waitTimes: number[] = []
    cardsWithInteraction.forEach(card => {
      if (card.createdAt && card.updatedAt) {
        const created = new Date(card.createdAt).getTime()
        const updated = new Date(card.updatedAt).getTime()
        const waitMinutes = (updated - created) / (60 * 1000)
        if (waitMinutes > 0 && waitMinutes < 24 * 60) {
          waitTimes.push(waitMinutes)
        }
      }
    })

    const avgWaitMinutes = waitTimes.length > 0
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
      : 0

    const durations: number[] = []
    cards.forEach(card => {
      const panel = panels.find(p => p.id === card.panelId)
      if (!panel?.steps) return
      const step = panel.steps.find((s: any) => s.id === card.stepId)
      
      if (step?.isFinal && card.createdAt && card.updatedAt) {
      const created = new Date(card.createdAt).getTime()
      const updated = new Date(card.updatedAt).getTime()
      const durationHours = (updated - created) / (60 * 60 * 1000)
      if (durationHours > 0 && durationHours < 365 * 24) {
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

    let departmentsWithChannels: any[] = []
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      const allDepartments = await departmentsService.listDepartments()
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

      if (card.sessionId) {
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

      if (!channelFound && card.tags && card.tags.length > 0) {
        card.tags.forEach(tag => {
          const matchingChannel = Array.from(channelIdToName.values()).find(
            name => name.toLowerCase().includes(tag.name.toLowerCase()) || 
                   tag.name.toLowerCase().includes(name.toLowerCase())
          )
          if (matchingChannel) {
            const count = channelMap.get(matchingChannel) || 0
            channelMap.set(matchingChannel, count + 1)
            channelFound = true
          } else {
            const count = channelMap.get(tag.name) || 0
            channelMap.set(tag.name, count + 1)
            channelFound = true
          }
        })
      }

      if (!channelFound && card.contactIds && card.contactIds.length > 0) {
        const contact = allContacts.find((c: { id: string }) => card.contactIds?.includes(c.id))
        if (contact?.customFields?.source) {
          const source = contact.customFields.source as string
          const count = channelMap.get(source) || 0
          channelMap.set(source, count + 1)
          channelFound = true
        }
      }

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
      .slice(0, 50)
  }

  private buildDailyVolume(cards: HelenaCard[], filters: DashboardFilters): DailyVolumeData[] {
    const periodDate = new Date(filters.date)
    periodDate.setHours(0, 0, 0, 0)
    const periodStart = periodDate.getTime()
    const periodEnd = periodDate.getTime() + 24 * 60 * 60 * 1000

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

