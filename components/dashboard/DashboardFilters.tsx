import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import { filterPresetsService } from '@/services/filters/filter-presets-service'

interface DashboardFiltersProps {
  readonly filters: DashboardFilters
  readonly onFilterChange?: (filters: DashboardFilters) => void
  readonly selectedPresetId?: string | null
  readonly onPresetUpdated?: () => void
}

export default function DashboardFiltersComponent({
  filters,
  onFilterChange,
  selectedPresetId,
  onPresetUpdated,
}: DashboardFiltersProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [availableSdrs, setAvailableSdrs] = useState<string[]>([])
  const [availableColleges, setAvailableColleges] = useState<string[]>([])
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/dashboard/filters')
        if (!response.ok) throw new Error('Failed to fetch filters')
        const filtersData = await response.json()
        
        setAvailableSdrs(filtersData.sdrs || [])
        setAvailableColleges(filtersData.colleges || [])
        setAvailableOrigins(filtersData.origins || [])
      } catch (error) {
        console.error('Error fetching filters:', error)
        setAvailableSdrs([])
        setAvailableColleges([])
        setAvailableOrigins([])
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    if (selectedPresetId) {
      const preset = filterPresetsService.getPreset(selectedPresetId)
      if (preset) {
        const filtersChanged =
          JSON.stringify(filters) !== JSON.stringify(preset.filters)
        setHasChanges(filtersChanged && !preset.isProtected)
      } else {
        setHasChanges(false)
      }
    } else {
      setHasChanges(false)
    }
  }, [filters, selectedPresetId])

  const handleChange = (field: keyof DashboardFilters, value: string) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [field]: value })
    }
  }

  const handleSaveToPreset = async () => {
    if (!selectedPresetId || !hasChanges) return

    const preset = filterPresetsService.getPreset(selectedPresetId)
    if (!preset || preset.isProtected) {
      toast.error('Este preset padrão não pode ser editado.')
      return
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Salvar alterações</p>
          <p className="text-sm">
            Deseja salvar as alterações nos filtros no preset &quot;{preset.name}&quot;?
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  setIsSaving(true)
                  filterPresetsService.updatePreset(selectedPresetId, { filters })
                  setHasChanges(false)
                  onPresetUpdated?.()
                  toast.success('Filtros salvos no preset com sucesso!')
                } catch (error: any) {
                  toast.error(error.message || 'Erro ao salvar no preset.')
                } finally {
                  setIsSaving(false)
                }
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        icon: '💾',
      }
    )
  }

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 border border-gray-100 mb-2 sm:mb-2.5 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Filtros do dashboard"
    >
      {hasChanges && selectedPresetId && (
        <div className="mb-1.5 sm:mb-2 flex justify-end">
          <button
            onClick={handleSaveToPreset}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Salvar alterações no preset"
          >
            <Save size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
            <span className="truncate">{isSaving ? 'Salvando...' : 'Salvar no Preset'}</span>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 sm:gap-2">
        <div>
          <label
            htmlFor="filter-date"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-secondary mb-0.5"
          >
            Data
          </label>
          <input
            id="filter-date"
            type="date"
            value={filters.date}
            onChange={(e) => handleChange('date', e.target.value)}
            aria-label="Filtro de data"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="filter-season"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-secondary mb-0.5"
          >
            Temporada
          </label>
          <select
            id="filter-season"
            value={filters.season}
            onChange={(e) => handleChange('season', e.target.value)}
            aria-label="Filtro de temporada"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="2025.1">2025.1</option>
            <option value="2024.2">2024.2</option>
            <option value="2024.1">2024.1</option>
            <option value="2023.2">2023.2</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-sdr"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-secondary mb-0.5"
          >
            SDR
          </label>
          <select
            id="filter-sdr"
            value={filters.sdr}
            onChange={(e) => handleChange('sdr', e.target.value)}
            aria-label="Filtro de SDR"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Todos">Todos</option>
            {availableSdrs.map((sdr) => (
              <option key={sdr} value={sdr}>
                {sdr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-college"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-secondary mb-0.5"
          >
            Faculdade
          </label>
          <select
            id="filter-college"
            value={filters.college}
            onChange={(e) => handleChange('college', e.target.value)}
            aria-label="Filtro de faculdade"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Todas">Todas</option>
            {availableColleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-origin"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-secondary mb-0.5"
          >
            Origem
          </label>
          <select
            id="filter-origin"
            value={filters.origin}
            onChange={(e) => handleChange('origin', e.target.value)}
            aria-label="Filtro de origem"
            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Todas</option>
            {availableOrigins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}

