'use client'

import { useState, useEffect } from 'react'
import { X, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import {
  filterPresetsService,
  type FilterPreset,
} from '@/services/filters/filter-presets-service'
interface FilterPresetsProps {
  readonly onSelectPreset: (filters: DashboardFilters) => Promise<void>
  readonly currentFilters: DashboardFilters
  readonly onPresetSelected?: (presetId: string | null) => void
}

export default function FilterPresets({
  onSelectPreset,
  currentFilters,
  onPresetSelected,
}: Readonly<FilterPresetsProps>) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  useEffect(() => {
    setPresets(filterPresetsService.getPresets())
  }, [])

  const handleSelectPreset = async (presetId: string) => {
    if (!presetId) {
      setSelectedPresetId(null)
      onPresetSelected?.(null)
      return
    }
    const preset = filterPresetsService.getPreset(presetId)
    if (preset) {
      setSelectedPresetId(presetId)
      onPresetSelected?.(presetId)
      const filtersToApply = {
        ...preset.filters,
        panelIds: currentFilters.panelIds,
      }
      await onSelectPreset(filtersToApply)
    }
  }

  const defaultPresets = presets.filter((p) => p.isProtected)
  const customPresets = presets.filter((p) => !p.isProtected)

  return (
    <div className="w-full">
      <select
        value={selectedPresetId || ''}
        onChange={(e) => handleSelectPreset(e.target.value)}
        className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-[9px] sm:text-[10px] md:text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        aria-label="Selecionar preset de filtros"
      >
        <option value="">Selecione um preset...</option>
        {defaultPresets.length > 0 && (
          <optgroup label="Presets Padrão">
            {defaultPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                🔒 {preset.name}
              </option>
            ))}
          </optgroup>
        )}
        {customPresets.length > 0 && (
          <optgroup label="Meus Presets">
            {customPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  )
}

export interface PresetDialogProps {
  readonly preset: FilterPreset | null
  readonly initialFilters: DashboardFilters
  readonly onClose: () => void
  readonly onSave: (name: string, filters: DashboardFilters) => void
}

export function PresetDialog({
  preset,
  initialFilters,
  onClose,
  onSave,
}: Readonly<PresetDialogProps>) {
  const [name, setName] = useState(preset?.name || '')
  const [filters, setFilters] = useState<DashboardFilters>({ ...initialFilters })
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

  const handleFilterChange = (field: keyof DashboardFilters, value: string) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Por favor, informe um nome para o preset.')
      return
    }
    onSave(name.trim(), filters)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 md:p-6 max-w-2xl w-full mx-2 sm:mx-4 shadow-xl my-4 sm:my-6 md:my-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-bold font-primary text-gray-900 dark:text-white">
            {preset ? 'Editar Preset' : 'Criar Novo Preset'}
          </h3>
      <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            aria-label="Fechar"
      >
            <X size={18} className="sm:w-5 sm:h-5" />
      </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="preset-name-input" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Nome do Preset
            </label>
            <input
              id="preset-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Filtros de Janeiro 2025"
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose()
                }
              }}
            />
          </div>

          <div>
            <span className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Configurar Filtros
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label htmlFor="preset-date-input" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data
                </label>
                <input
                  id="preset-date-input"
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="preset-sdr-select" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SDR
                </label>
                <select
                  id="preset-sdr-select"
                  value={filters.sdr}
                  onChange={(e) => handleFilterChange('sdr', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                <label htmlFor="preset-college-select" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Faculdade
                </label>
                <select
                  id="preset-college-select"
                  value={filters.college}
                  onChange={(e) => handleFilterChange('college', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Todas">Todas</option>
                  {availableColleges.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="preset-origin-select" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <select
                  id="preset-origin-select"
                  value={filters.origin}
                  onChange={(e) => handleFilterChange('origin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Configure os filtros que deseja salvar neste preset. Quando selecionar este preset, esses filtros serão aplicados automaticamente.
            </p>
          </div>

          {preset?.isProtected && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3">
              <Lock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Este preset padrão não pode ser editado.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-5 md:mt-6">
              <button
            onClick={handleSave}
            disabled={preset?.isProtected}
            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
            {preset ? 'Salvar Alterações' : 'Criar Preset'}
              </button>
              <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-secondary dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
    </div>
  )
}
