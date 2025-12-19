import type { WidgetConfig } from '@/types/charts'

export interface PersonalDashboard {
  id: string
  name: string
  widgets: WidgetConfig[]
  layout: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = 'crm-dashboard-personal-dashboards'

class PersonalDashboardsService {
  private dashboards: PersonalDashboard[] = []

  constructor() {
    this.loadDashboards()
  }

  private loadDashboards() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.dashboards = data.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        }))
      }
    } catch (error) {
      console.error('Failed to load personal dashboards:', error)
      this.dashboards = []
    }
  }

  private saveDashboards() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.dashboards))
    } catch (error) {
      console.error('Failed to save personal dashboards:', error)
    }
  }

  getDashboards(): PersonalDashboard[] {
    return [...this.dashboards]
  }

  getDashboard(id: string): PersonalDashboard | null {
    return this.dashboards.find((d) => d.id === id) || null
  }

  createDashboard(name: string, widgets: WidgetConfig[] = []): PersonalDashboard {
    const dashboard: PersonalDashboard = {
      id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      widgets,
      layout: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.dashboards.push(dashboard)
    this.saveDashboards()

    return dashboard
  }

  updateDashboard(id: string, updates: Partial<PersonalDashboard>): PersonalDashboard | null {
    const index = this.dashboards.findIndex((d) => d.id === id)
    if (index === -1) return null

    this.dashboards[index] = {
      ...this.dashboards[index],
      ...updates,
      updatedAt: new Date(),
    }
    this.saveDashboards()

    return this.dashboards[index]
  }

  deleteDashboard(id: string): boolean {
    const index = this.dashboards.findIndex((d) => d.id === id)
    if (index === -1) return false

    this.dashboards.splice(index, 1)
    this.saveDashboards()
    return true
  }
}

export const personalDashboardsService = new PersonalDashboardsService()

