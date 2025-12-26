import { NextRequest, NextResponse } from 'next/server'
import type { DashboardFilters } from '@/types/dashboard'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: DashboardFilters = body.filters || {
      date: '2025-12-17',
      season: '2025.1',
      sdr: 'Todos',
      college: 'Todas',
      origin: '',
    }

    const cookieHeader = request.headers.get('cookie')
    const data = await dataSourceAdapter.getDashboardData(filters, { cookieHeader })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    
    if (error instanceof Error) {
      let errorMessage = error.message
      
      if (error.message.includes('fetch failed') || error.message.includes('Network error')) {
        errorMessage = `Erro de conexão com a API do Helena. Verifique:
1. HELENA_API_BASE_URL deve ser: https://api.helena.run (não .com)
2. HELENA_API_TOKEN está correto
3. A URL está acessível
Erro original: ${error.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: DashboardFilters = {
      date: searchParams.get('date') || '2025-12-17',
      season: searchParams.get('season') || '2025.1',
      sdr: searchParams.get('sdr') || 'Todos',
      college: searchParams.get('college') || 'Todas',
      origin: searchParams.get('origin') || '',
    }

    const cookieHeader = request.headers.get('cookie')
    const data = await dataSourceAdapter.getDashboardData(filters, { cookieHeader })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    
    if (error instanceof Error) {
      let errorMessage = error.message
      
      if (error.message.includes('fetch failed') || error.message.includes('Network error')) {
        errorMessage = `Erro de conexão com a API do Helena. Verifique:
1. HELENA_API_BASE_URL deve ser: https://api.helena.run (não .com)
2. HELENA_API_TOKEN está correto
3. A URL está acessível
Erro original: ${error.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

