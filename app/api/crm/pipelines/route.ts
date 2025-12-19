import { NextRequest, NextResponse } from 'next/server'
import type { CrmPipeline } from '@/types/crm'
import { generateMockPipelines } from '@/services/mock-data-service'

const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL
const CRM_API_KEY = process.env.CRM_API_KEY
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || 
  !CRM_API_BASE_URL || 
  !CRM_API_KEY

export async function GET(request: NextRequest) {
  try {
    if (USE_MOCK_DATA) {
      const mockData = generateMockPipelines()
      return NextResponse.json(mockData)
    }

    const url = `${CRM_API_BASE_URL}/pipelines`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CRM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch pipelines from CRM API' },
        { status: response.status }
      )
    }

    const data: CrmPipeline[] = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CRM Pipelines API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

