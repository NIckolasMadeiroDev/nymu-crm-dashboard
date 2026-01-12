import { NextRequest, NextResponse } from 'next/server'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'
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
    
    // Determinar o tipo de gráfico e como filtrar
    const chartTitleLower = chartTitle?.toLowerCase() || ''
    const isLeadsCreated = chartTitleLower.includes('leads criados') || 
                           chartTitleLower.includes('geração')
    const isLeadStock = chartTitleLower.includes('estoque de leads')
    const isSalesByConversionTime = chartTitleLower.includes('tempo de conversão')

    // Buscar todos os cards (deals) e contatos
    const cardsService = helenaServiceFactory.getCardsService()
    const contactsService = helenaServiceFactory.getContactsService()
    const panelsService = helenaServiceFactory.getPanelsService()

    // Buscar todos os painéis para obter os steps
    // Use request deduplicator to prevent multiple simultaneous requests
    const panels = await requestDeduplicator.execute(
      'getPanelsWithDetails',
      () => panelsService.getPanelsWithDetails(),
      2000 // Minimum 2 seconds between panel requests
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

    // Buscar todos os cards
    let allCards: any[] = []
    if (filters.panelIds && filters.panelIds.length > 0) {
      // Buscar cards dos painéis selecionados
      const cardsPromises = filters.panelIds.map((panelId: string) =>
        cardsService.getAllCardsByPanel(panelId).catch(() => [])
      )
      const cardsResults = await Promise.allSettled(cardsPromises)
      allCards = cardsResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value)
    } else {
      // Buscar cards de todos os painéis
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

    // Filtrar cards baseado no tipo de gráfico
    const deals = allCards
      .filter((card: any) => {
        if (card.archived) return false
        
        if (isLeadsCreated) {
          // Para "Leads Criados", buscar todos os cards não arquivados
          // Mas precisamos ter createdAt
          if (!card.createdAt) return false
          return true
        } else if (isLeadStock) {
          // Para "Estoque de Leads", buscar todos os cards não arquivados
          // O filtro por categoria será feito depois baseado no stepId
          return true
        } else if (isSalesByConversionTime) {
          // Para "Vendas por Tempo de Conversão", buscar apenas vendas fechadas
          const stepInfo = stepMap.get(card.stepId || '')
          if (!stepInfo || !stepInfo.isFinal) return false

          const stepTitle = stepInfo.title?.toLowerCase() || ''
          return (
            stepTitle.includes('ganho') ||
            stepTitle.includes('fechado') ||
            stepTitle.includes('concluído') ||
            stepTitle.includes('vendido') ||
            stepTitle.includes('cliente ganho')
          )
        } else {
          // Para "Vendas", buscar apenas deals fechados (cards em etapas finais)
          const stepInfo = stepMap.get(card.stepId || '')
          if (!stepInfo || !stepInfo.isFinal) return false

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

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] After initial filter: deals.length=${deals.length}`)
    }

    // Filtrar deals por período e categoria (se aplicável)
    const filteredDeals = deals.filter((deal: any) => {
      // Para LeadStock, filtrar por categoria se especificada
      if (isLeadStock && period.type === 'date' && typeof period.value === 'string') {
        const stepInfo = stepMap.get(deal.stepId || '')
        if (!stepInfo) return false
        
        const category = period.value.toLowerCase().replace(/\s+/g, '')
        const stepTitle = stepInfo.title?.toLowerCase() || ''
        
        // Mapear categorias para etapas (aceitar tanto camelCase quanto minúsculas)
        if (category === 'contactlist' || category === 'contact_list') {
          // Lista de Contato - etapa inicial
          return !stepInfo.isFinal && stepInfo.position === 0
        } else if (category === 'firstcontact' || category === 'first_contact') {
          // Primeiro Contato - primeira etapa após inicial
          return !stepInfo.isFinal && stepInfo.position > 0 && stepInfo.position <= 1
        } else if (category === 'ingroup' || category === 'in_group') {
          // No Grupo - etapas intermediárias
          return !stepInfo.isFinal && stepInfo.position > 1 && stepInfo.position <= 2
        } else if (category === 'postmeet' || category === 'post_meet') {
          // Pós-Meet - etapas próximas ao final
          return !stepInfo.isFinal && stepInfo.position > 2
        }
        // Se não corresponder a nenhuma categoria específica, retornar todos
        return true
      }

      // Para leads criados, usar createdAt; para vendas, usar closedAt ou updatedAt
      const dateField = isLeadsCreated ? deal.createdAt : (deal.closedAt || deal.updatedAt)
      if (!dateField) return false

      const dealDate = new Date(dateField)

      if (period.type === 'week') {
        // Para "Leads Criados por Semana", usar a mesma lógica do dashboard
        // que calcula semanas relativas (0 = esta semana, 1 = semana passada, etc.)
        if (isLeadsCreated) {
          const now = Date.now()
          const cardTime = dealDate.getTime()
          const diffMs = now - cardTime
          const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
          
          // O gráfico usa week 1, 2, 3... mas o cálculo retorna 0, 1, 2...
          // Então precisamos converter: week 3 = diffWeeks 2
          // Sem 1 = esta semana (diffWeeks 0)
          // Sem 2 = semana passada (diffWeeks 1)
          // Sem 3 = 2 semanas atrás (diffWeeks 2)
          const weekIndex = diffWeeks
          const requestedWeek = typeof period.value === 'number' ? period.value : Number.parseInt(String(period.value), 10)
          
          const matches = weekIndex === (requestedWeek - 1) && weekIndex >= 0 && weekIndex < 12
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[API] Week filter: cardDate=${dealDate.toISOString()}, diffWeeks=${diffWeeks}, weekIndex=${weekIndex}, requestedWeek=${requestedWeek}, matches=${matches}`)
          }
          
          return matches
        } else {
          // Para vendas, usar a mesma lógica do dashboard: semanas relativas
          const now = Date.now()
          const cardTime = dealDate.getTime()
          const diffMs = now - cardTime
          const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
          
          // O gráfico usa week 1, 2, 3... mas o cálculo retorna 0, 1, 2...
          // Sem 1 = esta semana (diffWeeks 0)
          // Sem 2 = semana passada (diffWeeks 1)
          // Sem 3 = 2 semanas atrás (diffWeeks 2)
          const weekIndex = diffWeeks
          const requestedWeek = typeof period.value === 'number' ? period.value : Number.parseInt(String(period.value), 10)
          
          const matches = weekIndex === (requestedWeek - 1) && weekIndex >= 0 && weekIndex < 12
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[API] Sales week filter: cardDate=${dealDate.toISOString()}, diffWeeks=${diffWeeks}, weekIndex=${weekIndex}, requestedWeek=${requestedWeek}, matches=${matches}`)
          }
          
          return matches
        }
      } else if (period.type === 'days') {
        const days = typeof period.value === 'number' ? period.value : 0
        const now = new Date()
        const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        return dealDate >= daysAgo && dealDate <= now
      } else if (period.type === 'date') {
        // Para LeadStock, já foi filtrado acima
        if (isLeadStock) return true
        
        const periodDate = new Date(period.value as string)
        return (
          dealDate.getFullYear() === periodDate.getFullYear() &&
          dealDate.getMonth() === periodDate.getMonth() &&
          dealDate.getDate() === periodDate.getDate()
        )
      }
      return false
    })

    // Buscar contatos associados
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

    // Buscar informações de usuários
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

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] After period filter: filteredDeals.length=${filteredDeals.length}`)
    }

    // Enriquecer deals com informações formatadas
    const enrichedDeals = filteredDeals.map((deal: any) => {
      const dealDate = isLeadsCreated ? new Date(deal.createdAt) : new Date(deal.closedAt || deal.updatedAt)
      const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
      const user = users.find((u) => u.id === deal.owner)

      return {
        ...deal,
        // Datas formatadas
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
        // Valor formatado
        valueFormatted: formatCurrency(deal.value || 0),
        // Informações de contato
        contactName: contact?.name || deal.title || 'Sem contato associado',
        contactEmail: contact?.email || null,
        contactPhone: contact?.phone || null,
        // Informações de responsável
        ownerName: user?.name || deal.owner || 'Não atribuído',
        ownerEmail: user?.email || null,
        // Data relevante para o período
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

