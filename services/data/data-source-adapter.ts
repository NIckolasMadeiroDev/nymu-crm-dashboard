import type { DashboardData, DashboardFilters } from '@/types/dashboard'
import { isHelenaApiEnabled } from '@/services/helena/helena-config'
import { DashboardAdapter } from '@/services/helena/adapters/dashboard-adapter'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

export interface DataSourceAdapterOptions {
  cookieHeader?: string | null
}

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

class HelenaDataSource implements DataSource {
  private dashboardAdapter: DashboardAdapter

  constructor() {
    this.dashboardAdapter = new DashboardAdapter()
  }

  async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    return this.dashboardAdapter.getDashboardData(filters)
  }

  async getAvailableFilters(): Promise<{
    sdrs: string[]
    colleges: string[]
    origins: string[]
    seasons: string[]
  }> {
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      const contactsService = helenaServiceFactory.getContactsService()
      const panelsService = helenaServiceFactory.getPanelsService()

      // Get all panels first
      const panels = await panelsService.getAllPanels()
      
      // Get cards from all panels
      const cardsPromises = panels.map((panel: any) => 
        cardsService.getAllCardsByPanel(panel.id).catch(() => [])
      )
      
      const [cardsArrays, contacts] = await Promise.all([
        Promise.all(cardsPromises),
        contactsService.getAllContacts(),
      ])
      
      // Flatten cards from all panels
      const cards = cardsArrays.flat()

      const deals = cards

      const origins: string[] = Array.from(
        new Set(
          contacts
            .map((contact: any) => contact.customFields?.source as string)
            .filter((source: any): source is string => Boolean(source))
        )
      )

      const sdrs: string[] = Array.from(
        new Set(
          deals
            .map((deal: any) => deal.owner)
            .filter((owner: any): owner is string => Boolean(owner))
        )
      )

      const colleges: string[] = Array.from(
        new Set(
          contacts
            .map((contact: any) => contact.customFields?.college as string)
            .filter((college: any): college is string => Boolean(college))
        )
      )

      return {
        sdrs: sdrs.length > 0 ? sdrs : ['Todos'],
        colleges: colleges.length > 0 ? colleges : ['Todas'],
        origins: origins.length > 0 ? origins : [],
        seasons: ['2025.1', '2024.2', '2024.1', '2023.2'],
      }
    } catch (error) {
      console.error('Error fetching available filters from Helena:', error)
      return {
        sdrs: ['Todos'],
        colleges: ['Todas'],
        origins: [],
        seasons: ['2025.1', '2024.2', '2024.1', '2023.2'],
      }
    }
  }
}

class DataSourceAdapter {
  private getSource(options?: DataSourceAdapterOptions): DataSource {
    if (isHelenaApiEnabled(options?.cookieHeader)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DataSourceAdapter] Using Helena API (real data)')
      }
      return new HelenaDataSource()
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DataSourceAdapter] Using Mock Data')
      }
      return new MockDataSource()
    }
  }

  async getDashboardData(filters: DashboardFilters, options?: DataSourceAdapterOptions): Promise<DashboardData> {
    const source = this.getSource(options)
    return source.getDashboardData(filters)
  }

  async getAvailableFilters(options?: DataSourceAdapterOptions) {
    const source = this.getSource(options)
    return source.getAvailableFilters()
  }
}

export const dataSourceAdapter = new DataSourceAdapter()

