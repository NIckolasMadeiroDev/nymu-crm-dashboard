import type { DashboardFilters } from '@/types/dashboard'

export type ChartLayout = 'one' | 'two' | 'three'

export interface DashboardPreferences {
  chartLayout: ChartLayout
  selectedPresetId: string | null
  filters: DashboardFilters | null
  chartOrder?: string[]
}

const STORAGE_KEY = 'crm-dashboard-preferences'

class DashboardPreferencesService {
  private defaultPreferences: DashboardPreferences = {
    chartLayout: 'three',
    selectedPresetId: null,
    filters: null,
  }

  getPreferences(): DashboardPreferences {
    if (typeof window === 'undefined') {
      return { ...this.defaultPreferences }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          chartLayout: parsed.chartLayout || this.defaultPreferences.chartLayout,
          selectedPresetId: parsed.selectedPresetId ?? this.defaultPreferences.selectedPresetId,
          filters: parsed.filters || this.defaultPreferences.filters,
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard preferences:', error)
    }

    return { ...this.defaultPreferences }
  }

  savePreferences(preferences: Partial<DashboardPreferences>): void {
    if (typeof window === 'undefined') return

    try {
      const current = this.getPreferences()
      const updated: DashboardPreferences = {
        ...current,
        ...preferences,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error)
    }
  }

  saveChartLayout(layout: ChartLayout): void {
    this.savePreferences({ chartLayout: layout })
  }

  saveSelectedPresetId(presetId: string | null): void {
    this.savePreferences({ selectedPresetId: presetId })
  }

  saveFilters(filters: DashboardFilters | null): void {
    this.savePreferences({ filters })
  }

  saveChartOrder(chartOrder: string[]): void {
    this.savePreferences({ chartOrder })
  }

  getChartOrder(): string[] | undefined {
    return this.getPreferences().chartOrder
  }

  clearPreferences(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear dashboard preferences:', error)
    }
  }
}

export const dashboardPreferencesService = new DashboardPreferencesService()

