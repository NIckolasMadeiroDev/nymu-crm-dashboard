import { NextRequest, NextResponse } from 'next/server'
import type { CrmDeal } from '@/types/crm'
import { generateMockDeals } from '@/services/mock-data-service'
import { isHelenaApiEnabled } from '@/services/helena/helena-config'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

export async function GET(request: NextRequest) {
  try {
    if (!isHelenaApiEnabled()) {
      const mockData = generateMockDeals()
      return NextResponse.json(mockData)
    }

    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipelineId') || undefined
    const stageId = searchParams.get('stageId') || undefined
    const status = searchParams.get('status') || undefined

    const cardsService = helenaServiceFactory.getCardsService()
    const deals = await cardsService.getAllCards({
      panelId: pipelineId,
      stepId: stageId,
      status,
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('CRM Deals API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch deals from Helena API' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

