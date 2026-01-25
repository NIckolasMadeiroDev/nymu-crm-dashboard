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
    panels: Array<{ id: string; title: string; key: string }>
  }>
}

class HelenaDataSource implements DataSource {
  private readonly dashboardAdapter: DashboardAdapter

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
    panels: Array<{ id: string; title: string; key: string }>
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
            .filter(Boolean)
        )
      )

      const usersService = helenaServiceFactory.getUsersService()
      const allUsers = await usersService.getAllUsers()
      const userIdToNameMap = new Map<string, string>()
      allUsers.forEach((user: any) => {
        if (user.id && user.name) {
          userIdToNameMap.set(user.id, user.name)
        }
      })

      const uniqueUserIds = Array.from(
        new Set(
          deals
            .map((deal: any) => deal.owner || deal.responsibleUserId)
            .filter(Boolean)
        )
      )

      const sdrs: string[] = uniqueUserIds
        .map((userId: string) => userIdToNameMap.get(userId) || userId)
        .filter(Boolean)
        .sort()

      const colleges: string[] = Array.from(
        new Set(
          contacts
            .map((contact: any) => contact.customFields?.college as string)
            .filter(Boolean)
        )
      )

      // Get panels for filter (exclude archived and personal task panels)
      const availablePanels = panels
        .filter((panel: any) => !panel.archived && panel.scope !== 'USER')
        .map((panel: any) => ({
          id: panel.id,
          title: panel.title,
          key: panel.key,
        }))

      return {
        sdrs: sdrs.length > 0 ? sdrs : ['Todos'],
        colleges: colleges.length > 0 ? colleges : ['Todas'],
        origins: origins.length > 0 ? origins : [],
        panels: availablePanels || [],
      }
    } catch (error) {
      console.error('Error fetching available filters from Helena:', error)
      return {
        sdrs: ['Todos'],
        colleges: ['Todas'],
        origins: [],
        panels: [],
      }
    }
  }
}

class DataSourceAdapter {
  private getSource(options?: DataSourceAdapterOptions): DataSource {
    if (!isHelenaApiEnabled(options?.cookieHeader)) {
      throw new Error(
        'Helena API não está configurada. Configure HELENA_API_BASE_URL e HELENA_API_TOKEN nas variáveis de ambiente.'
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[DataSourceAdapter] Using Helena API (real data)')
    }
    return new HelenaDataSource()
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

