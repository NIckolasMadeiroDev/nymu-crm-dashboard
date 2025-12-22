import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envStatus = {
    HELENA_API_BASE_URL: process.env.HELENA_API_BASE_URL
      ? `${process.env.HELENA_API_BASE_URL.substring(0, 30)}...`
      : 'NOT SET',
    HELENA_API_TOKEN: process.env.HELENA_API_TOKEN
      ? `${process.env.HELENA_API_TOKEN.substring(0, 10)}...`
      : 'NOT SET',
    HELENA_API_TIMEOUT: process.env.HELENA_API_TIMEOUT || '30000 (default)',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'not set',
    NODE_ENV: process.env.NODE_ENV,
    isHelenaApiEnabled: !!(
      process.env.HELENA_API_BASE_URL &&
      process.env.HELENA_API_TOKEN &&
      process.env.USE_MOCK_DATA !== 'true'
    ),
  }

  return NextResponse.json(envStatus, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

