import type { DashboardData, DashboardFilters } from '@/types/dashboard'

export interface DataSource {
  getDashboardData(filters: DashboardFilters): Promise<DashboardData>
  getAvailableFilters(): Promise<{
    sdrs: string[]
    colleges: string[]
    origins: string[]
    seasons: string[]
  }>
}

class MockDataSource implements DataSource {
  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    const { generateMockDashboardData } = await import(
      '@/services/dashboard-mock-service'
    )
    return generateMockDashboardData(filters)
  }

  async getAvailableFilters() {
    const { SDRS, COLLEGES, ORIGINS } = await import(
      '@/services/dashboard-mock-service'
    )
    return {
      sdrs: SDRS,
      colleges: COLLEGES,
      origins: ORIGINS,
      seasons: ['2025.1', '2024.2', '2024.1', '2023.2'],
    }
  }
}

class ApiDataSource implements DataSource {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    const response = await fetch(`${this.baseUrl}/api/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getAvailableFilters() {
    const response = await fetch(`${this.baseUrl}/api/dashboard/filters`)

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }
}

class DataSourceAdapter {
  private source: DataSource

  constructor() {
    const useApi = process.env.NEXT_PUBLIC_USE_API === 'true'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (useApi && apiUrl) {
      this.source = new ApiDataSource(apiUrl)
    } else {
      this.source = new MockDataSource()
    }
  }

  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    return this.source.getDashboardData(filters)
  }

  async getAvailableFilters() {
    return this.source.getAvailableFilters()
  }

  switchToApi(baseUrl: string) {
    this.source = new ApiDataSource(baseUrl)
  }

  switchToMock() {
    this.source = new MockDataSource()
  }
}

export const dataSourceAdapter = new DataSourceAdapter()

