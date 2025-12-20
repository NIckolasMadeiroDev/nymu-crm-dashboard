import type { DashboardFilters } from '@/types/dashboard'

export type ChartLayout = 'one' | 'two' | 'three'
export type WidgetHeight = 'normal' | 'large' | 'extraLarge'

export interface DashboardPreferences {
  chartLayout: ChartLayout
  selectedPresetId: string | null
  filters: DashboardFilters | null
  chartOrder?: string[]
  widgetHeight?: WidgetHeight
}

const STORAGE_KEY = 'crm-dashboard-preferences'

class DashboardPreferencesService {
  private defaultPreferences: DashboardPreferences = {
    chartLayout: 'three',
    selectedPresetId: null,
    filters: null,
    widgetHeight: 'normal',
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
          widgetHeight: parsed.widgetHeight || this.defaultPreferences.widgetHeight,
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

  saveWidgetHeight(height: WidgetHeight): void {
    this.savePreferences({ widgetHeight: height })
  }

  getWidgetHeight(): WidgetHeight {
    return this.getPreferences().widgetHeight || 'normal'
  }

  getWidgetHeightPx(): number {
    const height = this.getWidgetHeight()
    switch (height) {
      case 'normal':
        return 320
      case 'large':
        return 350
      case 'extraLarge':
        return 500
      default:
        return 300
    }
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

