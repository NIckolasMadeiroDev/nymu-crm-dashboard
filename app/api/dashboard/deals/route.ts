import { NextRequest, NextResponse } from 'next/server'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import { formatCurrency } from '@/utils/format-currency'
import { requestDeduplicator } from '@/services/helena/adapters/request-deduplicator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period, filters, chartTitle } = body

    if (!period || !filters) {
      return NextResponse.json(
        { error: 'Period and filters are required' },
        { status: 400 }
      )
    }
    
    const chartTitleLower = chartTitle?.toLowerCase() || ''
    const isLeadsCreated = chartTitleLower.includes('leads criados') || 
                           chartTitleLower.includes('geração')
    const isLeadStock = chartTitleLower.includes('estoque de leads')
    const isSalesByConversionTime = chartTitleLower.includes('tempo de conversão')

    const cardsService = helenaServiceFactory.getCardsService()
    const contactsService = helenaServiceFactory.getContactsService()
    const panelsService = helenaServiceFactory.getPanelsService()

    const panels = await requestDeduplicator.execute(
      'getPanelsWithDetails',
      () => panelsService.getPanelsWithDetails(),
      2000
    )
    const stepMap = new Map<string, any>()

    panels.forEach((panel: any) => {
      if (panel.steps && Array.isArray(panel.steps)) {
        panel.steps.forEach((step: any) => {
          stepMap.set(step.id, {
            ...step,
            panelId: panel.id,
            panelTitle: panel.title,
          })
        })
      }
    })

    let allCards: any[] = []
    if (filters.panelIds && filters.panelIds.length > 0) {
      const cardsPromises = filters.panelIds.map((panelId: string) =>
        cardsService.getAllCardsByPanel(panelId).catch(() => [])
      )
      const cardsResults = await Promise.allSettled(cardsPromises)
      allCards = cardsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value)
    } else {
      const departmentPanels = panels.filter(
        (p: any) => !p.archived && p.scope === 'DEPARTMENT'
      )
      const cardsPromises = departmentPanels.map((panel: any) =>
        cardsService.getAllCardsByPanel(panel.id).catch(() => [])
      )
      const cardsResults = await Promise.allSettled(cardsPromises)
      allCards = cardsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value)
    }

    const deals = allCards
      .filter((card: any) => {
        if (card.archived) return false
        
        if (isLeadsCreated) {
          if (!card.createdAt) return false
          return true
        } else if (isLeadStock) {
          return true
        } else if (isSalesByConversionTime || !isLeadsCreated && !isLeadStock) {
          const stepInfo = stepMap.get(card.stepId || '')
          if (!stepInfo?.isFinal) return false

          const stepTitle = stepInfo.title?.toLowerCase() || ''
          return (
            stepTitle.includes('ganho') ||
            stepTitle.includes('fechado') ||
            stepTitle.includes('concluído') ||
            stepTitle.includes('vendido') ||
            stepTitle.includes('cliente ganho')
          )
        }
      })
      .map((card: any) => ({
        id: card.id,
        title: card.title,
        value: card.monetaryAmount || card.value || 0,
        stageId: card.stepId || '',
        pipelineId: card.panelId || '',
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        closedAt: isLeadsCreated ? undefined : (card.closedAt || card.updatedAt),
        owner: card.responsibleUserId || card.ownerId,
        contactIds: card.contactIds || [],
      }))

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] After initial filter: deals.length=${deals.length}`)
    }

    const matchesLeadStockCategory = (deal: any, category: string, stepInfo: any): boolean => {
      if (category === 'contactlist' || category === 'contact_list') {
        return !stepInfo.isFinal && stepInfo.position === 0
      }
      if (category === 'firstcontact' || category === 'first_contact') {
        return !stepInfo.isFinal && stepInfo.position > 0 && stepInfo.position <= 1
      }
      if (category === 'ingroup' || category === 'in_group') {
        return !stepInfo.isFinal && stepInfo.position > 1 && stepInfo.position <= 2
      }
      if (category === 'postmeet' || category === 'post_meet') {
        return !stepInfo.isFinal && stepInfo.position > 2
      }
      return true
    }

    const matchesWeekPeriod = (dealDate: Date, requestedWeek: number): boolean => {
      const now = Date.now()
      const cardTime = dealDate.getTime()
      const diffMs = now - cardTime
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
      const weekIndex = diffWeeks
      const matches = weekIndex === (12 - requestedWeek) && weekIndex >= 0 && weekIndex < 12
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Week filter: cardDate=${dealDate.toISOString()}, diffWeeks=${diffWeeks}, weekIndex=${weekIndex}, requestedWeek=${requestedWeek}, matches=${matches}`)
      }
      
      return matches
    }

    const matchesDaysPeriod = (dealDate: Date, days: number): boolean => {
      const now = new Date()
      const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return dealDate >= daysAgo && dealDate <= now
    }

    const matchesDatePeriod = (dealDate: Date, periodValue: string): boolean => {
      const periodDate = new Date(periodValue)
      return (
        dealDate.getFullYear() === periodDate.getFullYear() &&
        dealDate.getMonth() === periodDate.getMonth() &&
        dealDate.getDate() === periodDate.getDate()
      )
    }

    const filteredDeals = deals.filter((deal: any) => {
      if (isLeadStock && period.type === 'date' && typeof period.value === 'string') {
        const stepInfo = stepMap.get(deal.stepId || '')
        if (!stepInfo) return false
        const category = period.value.toLowerCase().split(/\s+/).join('')
        return matchesLeadStockCategory(deal, category, stepInfo)
      }

      const dateField = isLeadsCreated ? deal.createdAt : (deal.closedAt || deal.updatedAt)
      if (!dateField) return false

      const dealDate = new Date(dateField)

      if (period.type === 'week') {
        const requestedWeek = typeof period.value === 'number' ? period.value : Number.parseInt(String(period.value), 10)
        return matchesWeekPeriod(dealDate, requestedWeek)
      }
      
      if (period.type === 'days') {
        const days = typeof period.value === 'number' ? period.value : 0
        return matchesDaysPeriod(dealDate, days)
      }
      
      if (period.type === 'date') {
        if (isLeadStock) return true
        return matchesDatePeriod(dealDate, period.value as string)
      }
      
      return false
    })

    const contactIds = new Set<string>()
    filteredDeals.forEach((deal: any) => {
      if (deal.contactIds && Array.isArray(deal.contactIds)) {
        deal.contactIds.forEach((id: string) => contactIds.add(id))
      }
    })

    let contacts: any[] = []
    if (contactIds.size > 0) {
      const contactsPromises = Array.from(contactIds).map((id) =>
        contactsService.getContactById(id).catch(() => null)
      )
      const contactsResults = await Promise.allSettled(contactsPromises)
      contacts = contactsResults
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => (result as PromiseFulfilledResult<any>).value)
    }

    const usersService = helenaServiceFactory.getUsersService()
    const userIds = new Set<string>()
    filteredDeals.forEach((deal: any) => {
      if (deal.owner) userIds.add(deal.owner)
    })

    let users: any[] = []
    if (userIds.size > 0) {
      try {
        const allUsers = await usersService.getAllUsers()
        users = allUsers.filter((u) => userIds.has(u.id))
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] After period filter: filteredDeals.length=${filteredDeals.length}`)
    }

    const enrichedDeals = filteredDeals.map((deal: any) => {
      const dealDate = isLeadsCreated ? new Date(deal.createdAt) : new Date(deal.closedAt || deal.updatedAt)
      const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
      const user = users.find((u) => u.id === deal.owner)

      return {
        ...deal,
        createdAtFormatted: deal.createdAt
          ? new Date(deal.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
        closedAtFormatted: deal.closedAt
          ? new Date(deal.closedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
        updatedAtFormatted: deal.updatedAt
          ? new Date(deal.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
        valueFormatted: formatCurrency(deal.value || 0),
        contactName: contact?.name || deal.title || 'Sem contato associado',
        contactEmail: contact?.email || null,
        contactPhone: contact?.phone || null,
        ownerName: user?.name || deal.owner || 'Não atribuído',
        ownerEmail: user?.email || null,
        relevantDate: dealDate.toISOString(),
        relevantDateFormatted: dealDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })

    return NextResponse.json({
      deals: enrichedDeals,
      contacts,
      users,
    })
  } catch (error: any) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

