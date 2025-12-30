import { NextRequest, NextResponse } from 'next/server'
import { isHelenaApiEnabled } from '@/services/helena/helena-config'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

export async function GET(request: NextRequest) {
  try {
    if (!isHelenaApiEnabled()) {
      return NextResponse.json(
        { 
          error: 'Helena API não está configurada. Configure HELENA_API_BASE_URL e HELENA_API_TOKEN nas variáveis de ambiente.' 
        },
        { status: 503 }
      )
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

