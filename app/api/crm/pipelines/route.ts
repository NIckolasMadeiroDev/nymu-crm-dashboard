import { NextRequest, NextResponse } from 'next/server'
import type { CrmPipeline } from '@/types/crm'
import { generateMockPipelines } from '@/services/mock-data-service'
import { isHelenaApiEnabled } from '@/services/helena/helena-config'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

export async function GET(request: NextRequest) {
  try {
    if (!isHelenaApiEnabled()) {
      const mockData = generateMockPipelines()
      return NextResponse.json(mockData)
    }

    const panelsService = helenaServiceFactory.getPanelsService()
    const pipelines = await panelsService.getAllPanels()

    return NextResponse.json(pipelines)
  } catch (error) {
    console.error('CRM Pipelines API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch pipelines from Helena API' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

