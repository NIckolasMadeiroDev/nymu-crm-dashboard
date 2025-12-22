import { NextRequest, NextResponse } from 'next/server'
import { getHelenaApiConfig } from '@/services/helena/helena-config'

export async function GET(request: NextRequest) {
  try {
    const config = getHelenaApiConfig()
    const testUrl = `${config.baseUrl}/core/v1/contact`
    
    console.log('[Test Helena] Testing connection to:', testUrl)
    console.log('[Test Helena] Config:', {
      baseUrl: config.baseUrl,
      hasToken: !!config.token,
      tokenPrefix: config.token?.substring(0, 10),
      timeout: config.timeout,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Helena-CRM-Dashboard/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('[Test Helena] Response status:', response.status)
      console.log('[Test Helena] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Test Helena] Error response:', errorText)
        return NextResponse.json({
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: testUrl,
        }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        status: response.status,
        data: Array.isArray(data) ? { count: data.length, sample: data.slice(0, 2) } : data,
        url: testUrl,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      console.error('[Test Helena] Fetch error:', fetchError)
      
      if (fetchError instanceof Error) {
        return NextResponse.json({
          success: false,
          error: {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack,
            cause: (fetchError as any).cause,
          },
          url: testUrl,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        error: 'Unknown fetch error',
        url: testUrl,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[Test Helena] Config error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}




