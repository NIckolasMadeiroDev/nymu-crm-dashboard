import { NextRequest, NextResponse } from 'next/server'
import { generateMockPipelines } from '@/services/mock-data-service'
import { isHelenaApiEnabled } from '@/services/helena/helena-config'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

export async function GET(request: NextRequest) {
  try {
    const apiEnabled = isHelenaApiEnabled()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API /crm/pipelines] Helena API enabled:', apiEnabled)
    }

    if (!apiEnabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API /crm/pipelines] Using mock data')
      }
      const mockData = generateMockPipelines()
      return NextResponse.json(mockData)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /crm/pipelines] Fetching from Helena API...')
    }

    const panelsService = helenaServiceFactory.getPanelsService()
    const pipelines = await panelsService.getAllPanels()

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /crm/pipelines] Fetched', pipelines.length, 'panels')
    }

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

