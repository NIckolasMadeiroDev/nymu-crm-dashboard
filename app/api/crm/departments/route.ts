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
      console.log('[API /crm/departments] Fetching from Helena API...')
    }

    const departmentsService = helenaServiceFactory.getDepartmentsService()
    const departments = await departmentsService.listDepartments()

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /crm/departments] Fetched', departments.length, 'departments')
    }

    return NextResponse.json(departments)
  } catch (error) {
    console.error('CRM Departments API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch departments from Helena API' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isHelenaApiEnabled()) {
      return NextResponse.json(
        { 
          error: 'Helena API não está configurada. Configure HELENA_API_BASE_URL e HELENA_API_TOKEN nas variáveis de ambiente.' 
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const departmentsService = helenaServiceFactory.getDepartmentsService()
    const department = await departmentsService.createDepartment(body)

    return NextResponse.json(department)
  } catch (error) {
    console.error('CRM Departments API error (POST):', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create department' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

