import { NextRequest, NextResponse } from 'next/server'
import { getHelenaApiConfig } from '@/services/helena/helena-config'

export async function GET(request: NextRequest) {
  return handleHelenaRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleHelenaRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return handleHelenaRequest(request, 'PUT')
}

export async function DELETE(request: NextRequest) {
  return handleHelenaRequest(request, 'DELETE')
}

async function handleHelenaRequest(request: NextRequest, method: string) {
  try {
    const config = getHelenaApiConfig()
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      )
    }

    // Construir URL completa
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
    const fullUrl = `${config.baseUrl}/${cleanEndpoint}`

    // Preparar headers
    const headers: HeadersInit = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Preparar opções da requisição
    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    // Adicionar body se não for GET
    if (method !== 'GET' && request.body) {
      const body = await request.json()
      fetchOptions.body = JSON.stringify(body)
    }

    // Fazer requisição para a API Helena
    const response = await fetch(fullUrl, fetchOptions)

    // Obter dados da resposta
    const data = await response.json()

    // Retornar resposta
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Helena Proxy] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

