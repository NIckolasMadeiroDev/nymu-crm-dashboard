import type { DashboardFilters } from '@/types/dashboard'

export interface FilterPreset {
  id: string
  name: string
  filters: DashboardFilters
  isDefault?: boolean
  isProtected?: boolean
  createdAt: Date
}

const STORAGE_KEY = 'crm-dashboard-filter-presets'

class FilterPresetsService {
  private presets: FilterPreset[] = []

  constructor() {
    this.loadPresets()
  }

  private loadPresets() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const loadedPresets = data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }))

        const hasDefaultPresets = loadedPresets.some((p: FilterPreset) => p.isProtected)
        if (!hasDefaultPresets) {
          this.createDefaultPresets()
          const defaultPresets = this.presets.filter((p) => p.isProtected)
          this.presets = [...defaultPresets, ...loadedPresets.filter((p: FilterPreset) => !p.isProtected)]
        } else {
          this.presets = loadedPresets
        }
      } else {
        this.createDefaultPresets()
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
      this.createDefaultPresets()
    }
  }

  private createDefaultPresets() {
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    const lastQuarter = new Date(today)
    lastQuarter.setMonth(today.getMonth() - 3)

    this.presets = [
      {
        id: 'preset-default-today',
        name: 'Hoje',
        filters: {
          date: formatDate(today),
          sdr: 'Todos',
          college: 'Todas',
          origin: '',
        },
        isDefault: true,
        isProtected: true,
        createdAt: today,
      },
      {
        id: 'preset-default-last-week',
        name: 'Última Semana',
        filters: {
          date: formatDate(lastWeek),
          sdr: 'Todos',
          college: 'Todas',
          origin: '',
        },
        isProtected: true,
        createdAt: today,
      },
      {
        id: 'preset-default-last-month',
        name: 'Último Mês',
        filters: {
          date: formatDate(lastMonth),
          sdr: 'Todos',
          college: 'Todas',
          origin: '',
        },
        isProtected: true,
        createdAt: today,
      },
      {
        id: 'preset-default-last-quarter',
        name: 'Último Trimestre',
        filters: {
          date: formatDate(lastQuarter),
          sdr: 'Todos',
          college: 'Todas',
          origin: '',
        },
        isProtected: true,
        createdAt: today,
      },
    ]
    this.savePresets()
  }

  private savePresets() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets))
    } catch (error) {
      console.error('Failed to save filter presets:', error)
    }
  }

  getPresets(): FilterPreset[] {
    return [...this.presets]
  }

  getPreset(id: string): FilterPreset | null {
    return this.presets.find((p) => p.id === id) || null
  }

  createPreset(name: string, filters: DashboardFilters): FilterPreset {
    const preset: FilterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
      createdAt: new Date(),
    }

    this.presets.push(preset)
    this.savePresets()

    return preset
  }

  updatePreset(id: string, updates: Partial<FilterPreset>): FilterPreset | null {
    const preset = this.presets.find((p) => p.id === id)
    if (!preset) return null

    if (preset.isProtected) {
      throw new Error('Não é possível editar presets padrão protegidos.')
    }

    const index = this.presets.findIndex((p) => p.id === id)
    this.presets[index] = {
      ...this.presets[index],
      ...updates,
      id: this.presets[index].id,
      isProtected: false,
      createdAt: this.presets[index].createdAt,
    }
    this.savePresets()

    return this.presets[index]
  }

  deletePreset(id: string): boolean {
    const preset = this.presets.find((p) => p.id === id)
    if (!preset) return false

    if (preset.isProtected) {
      throw new Error('Não é possível excluir presets padrão protegidos.')
    }

    const index = this.presets.findIndex((p) => p.id === id)
    this.presets.splice(index, 1)
    this.savePresets()
    return true
  }

  isPresetProtected(id: string): boolean {
    const preset = this.presets.find((p) => p.id === id)
    return preset?.isProtected === true
  }

  setDefaultPreset(id: string): boolean {
    this.presets.forEach((p) => {
      p.isDefault = p.id === id
    })
    this.savePresets()
    return true
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export const filterPresetsService = new FilterPresetsService()

