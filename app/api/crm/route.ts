import { NextRequest, NextResponse } from 'next/server'

const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL
const CRM_API_KEY = process.env.CRM_API_KEY

if (!CRM_API_BASE_URL || !CRM_API_KEY) {
  console.warn('CRM API credentials not configured')
}

export async function GET(request: NextRequest) {
  try {
    if (!CRM_API_BASE_URL || !CRM_API_KEY) {
      return NextResponse.json(
        { error: 'CRM API not configured' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint') || ''

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      )
    }

    const url = `${CRM_API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CRM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from CRM API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('CRM API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

