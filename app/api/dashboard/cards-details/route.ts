import { NextRequest, NextResponse } from 'next/server'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'
import type { DashboardFilters } from '@/types/dashboard'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: DashboardFilters = body.filters || {
      date: '2025-12-17',
      sdr: 'Todos',
      college: 'Todas',
      origin: '',
      panelIds: undefined,
    }
    const cardType = body.cardType as 'leadsCreated' | 'leadsInGroup' | 'meetParticipants' | 'closedSales' | 'revenue'

    const cookieHeader = request.headers.get('cookie')
    const dashboardData = await dataSourceAdapter.getDashboardData(filters, { cookieHeader })

    const { helenaServiceFactory } = await import('@/services/helena/helena-service-factory')
    const panelsService = helenaServiceFactory.getPanelsService()
    const panels = await panelsService.getPanelsWithDetails()

    const stepMap = new Map<string, { title: string; panelId: string; panelTitle: string; panelKey: string }>()
    
    panels.forEach((panel: any) => {
      if (panel.steps && Array.isArray(panel.steps)) {
        panel.steps.forEach((step: any) => {
          if (step.id && !step.archived) {
            stepMap.set(step.id, {
              title: step.title || step.name || '',
              panelId: panel.id,
              panelTitle: panel.title || '',
              panelKey: panel.key || '',
            })
          }
        })
      }
    })

    let cards: any[] = []
    const leads = dashboardData.leads || []
    const deals = dashboardData.deals || []

    switch (cardType) {
      case 'leadsCreated':
        cards = leads.map((lead: any) => {
          const stepInfo = stepMap.get(lead.stageId || '')
          return {
            id: lead.id,
            title: lead.title || '',
            value: lead.value || 0,
            stageId: lead.stageId || '',
            pipelineId: lead.pipelineId || '',
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
            owner: lead.owner,
            contactIds: lead.contactIds || [],
            panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
            panelKey: stepInfo?.panelKey || '',
            stepTitle: stepInfo?.title || 'Etapa não encontrada',
          }
        })
        break

      case 'leadsInGroup': {
        const panel02 = panels.find((p: any) => p.key === '02')
        if (!panel02) {
          cards = []
          break
        }

        const { helenaServiceFactory } = await import('@/services/helena/helena-service-factory')
        const cardsService = helenaServiceFactory.getCardsService()
        const allCardsFromPanel02 = await cardsService.getAllCardsByPanel(panel02.id)

        const grupoStepIds = new Set<string>()
        panel02.steps?.forEach((step: any) => {
          const stepTitle = (step.title || step.name || '').toLowerCase()
          if (stepTitle.includes('grupo') || stepTitle.includes('entrou no grupo')) {
            if (step.id) grupoStepIds.add(step.id)
          }
        })

        const cardsInGrupo = allCardsFromPanel02.filter((card: any) => {
          if (card.archived) return false
          const currentStepId = card.stepId || ''
          return grupoStepIds.has(currentStepId) || grupoStepIds.has(card.stageId || '')
        })

        cards = cardsInGrupo.map((card: any) => {
          const stepInfo = stepMap.get(card.stepId || card.stageId || '')
          return {
            id: card.id,
            title: card.title || '',
            value: card.value || card.monetaryAmount || 0,
            stageId: card.stepId || card.stageId || '',
            pipelineId: card.pipelineId || panel02.id,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
            owner: card.owner,
            contactIds: card.contactIds || [],
            panelTitle: panel02.title || 'Painel 02',
            panelKey: panel02.key || '02',
            stepTitle: stepInfo?.title || 'Etapa não encontrada',
            enteredGroupDate: stepInfo && grupoStepIds.has(card.stepId || card.stageId || '') ? card.updatedAt : null,
          }
        })
        break
      }

      case 'meetParticipants':
        cards = leads
          .filter((lead: any) => {
            const stepInfo = stepMap.get(lead.stageId || '')
            const stepTitle = (stepInfo?.title || '').toLowerCase()
            return stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')
          })
          .map((lead: any) => {
            const stepInfo = stepMap.get(lead.stageId || '')
            return {
              id: lead.id,
              title: lead.title || '',
              value: lead.value || 0,
              stageId: lead.stageId || '',
              pipelineId: lead.pipelineId || '',
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt,
              owner: lead.owner,
              contactIds: lead.contactIds || [],
              panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
              panelKey: stepInfo?.panelKey || '',
              stepTitle: stepInfo?.title || 'Etapa não encontrada',
            }
          })
        break

      case 'closedSales':
      case 'revenue':
        cards = deals.map((deal: any) => {
          const stepInfo = stepMap.get(deal.stageId || '')
          return {
            id: deal.id,
            title: deal.title || '',
            value: deal.value || 0,
            stageId: deal.stageId || '',
            pipelineId: deal.pipelineId || '',
            createdAt: deal.createdAt,
            updatedAt: deal.updatedAt,
            closedAt: deal.closedAt,
            owner: deal.owner,
            contactIds: deal.contactIds || [],
            panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
            panelKey: stepInfo?.panelKey || '',
            stepTitle: stepInfo?.title || 'Etapa não encontrada',
          }
        })
        break
    }

    return NextResponse.json({
      cards,
      contacts: dashboardData.contacts || [],
      users: dashboardData.users || [],
    })
  } catch (error) {
    console.error('Cards details API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

