import { NextRequest, NextResponse } from 'next/server'
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
    const pipelineId = searchParams.get('pipelineId')
    const stageId = searchParams.get('stageId')

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      )
    }

    const cardsService = helenaServiceFactory.getCardsService()
    
    let deals
    if (stageId) {
      deals = await cardsService.getCardsByStep(pipelineId, stageId)
    } else {
      deals = await cardsService.getAllCardsByPanel(pipelineId)
    }

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

