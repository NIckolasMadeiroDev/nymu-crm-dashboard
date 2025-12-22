import { NextRequest, NextResponse } from 'next/server'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'

export async function GET(request: NextRequest) {
  try {
    const filters = await dataSourceAdapter.getAvailableFilters()
    return NextResponse.json(filters)
  } catch (error) {
    console.error('Dashboard Filters API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load available filters' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

