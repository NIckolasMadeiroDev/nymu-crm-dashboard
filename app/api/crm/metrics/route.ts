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

    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipelineId') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const metricsService = helenaServiceFactory.getMetricsService()
    const metrics = await metricsService.getMetrics({
      pipelineId,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('CRM Metrics API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch metrics from Helena API' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

