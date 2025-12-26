'use client'

import { useState, useEffect } from 'react'
import { X, Save, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import { SDRS, COLLEGES, ORIGINS } from '@/services/dashboard-mock-service'
import {
  filterPresetsService,
  type FilterPreset,
} from '@/services/filters/filter-presets-service'
import { PresetDialog } from '@/components/filters/FilterPresets'

interface FiltersModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly filters: DashboardFilters
  readonly onFilterChange: (filters: DashboardFilters) => void
  readonly selectedPresetId?: string | null
  readonly onPresetUpdated?: () => void
}

export default function FiltersModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  selectedPresetId,
  onPresetUpdated,
}: Readonly<FiltersModalProps>) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPresetDialog, setShowPresetDialog] = useState(false)

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
    onFilterChange({ ...filters, [field]: value })
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

  const handleCreatePreset = () => {
    setShowPresetDialog(true)
  }

  const handleSavePreset = (name: string, presetFilters: DashboardFilters) => {
    if (!name.trim()) {
      toast.error('Por favor, informe um nome para o preset.')
      return
    }

    try {
      filterPresetsService.createPreset(name.trim(), presetFilters)
      onPresetUpdated?.()
      toast.success('Preset criado com sucesso!')
      setShowPresetDialog(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar preset.')
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open={isOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 w-full max-w-full bg-transparent"
        aria-modal="true"
        aria-labelledby="filters-modal-title"
        onCancel={onClose}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              id="filters-modal-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 dark:text-white"
            >
              Filtros
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              aria-label="Fechar filtros"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label
                htmlFor="filter-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Data
              </label>
              <input
                id="filter-date"
                type="date"
                value={filters.date}
                onChange={(e) => handleChange('date', e.target.value)}
                aria-label="Filtro de data"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="filter-season"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Temporada
              </label>
              <select
                id="filter-season"
                value={filters.season}
                onChange={(e) => handleChange('season', e.target.value)}
                aria-label="Filtro de temporada"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                SDR
              </label>
              <select
                id="filter-sdr"
                value={filters.sdr}
                onChange={(e) => handleChange('sdr', e.target.value)}
                aria-label="Filtro de SDR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Todos">Todos</option>
                {SDRS.map((sdr) => (
                  <option key={sdr} value={sdr}>
                    {sdr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-college"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Faculdade
              </label>
              <select
                id="filter-college"
                value={filters.college}
                onChange={(e) => handleChange('college', e.target.value)}
                aria-label="Filtro de faculdade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Todas">Todas</option>
                {COLLEGES.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="filter-origin"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Origem
              </label>
              <select
                id="filter-origin"
                value={filters.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                aria-label="Filtro de origem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todas</option>
                {ORIGINS.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreatePreset}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-secondary text-sm"
                aria-label="Criar novo preset"
              >
                <Plus size={16} />
                Novo Preset
              </button>
              {hasChanges && selectedPresetId && (
                <button
                  onClick={handleSaveToPreset}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary text-sm"
                >
                  <Save size={16} />
                  Salvar no Preset
                </button>
              )}
              <button
                onClick={() => {
                  const defaultFilters: DashboardFilters = {
                    date: new Date().toISOString().split('T')[0],
                    season: '2025.1',
                    sdr: 'Todos',
                    college: 'Todas',
                    origin: '',
                  }
                  onFilterChange(defaultFilters)
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-secondary text-sm"
                aria-label="Limpar filtros"
              >
                Limpar Filtros
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-secondary text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onFilterChange(filters)
                  onClose()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary text-sm"
              >
                Salvar Filtros
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {showPresetDialog && (
        <PresetDialog
          preset={null}
          initialFilters={filters}
          onClose={() => setShowPresetDialog(false)}
          onSave={handleSavePreset}
        />
      )}
    </>
  )
}

export function countActiveFilters(filters: DashboardFilters): number {
  let count = 0

  // SDR está ativo se não for "Todos"
  if (filters.sdr && filters.sdr !== 'Todos') {
    count++
  }

  // Faculdade está ativa se não for "Todas"
  if (filters.college && filters.college !== 'Todas') {
    count++
  }

  // Origem está ativa se não for vazia
  if (filters.origin && filters.origin !== '') {
    count++
  }

  // Data e Temporada sempre têm valores, então não contamos como "ativos"
  // Mas podemos considerar se quiser mostrar que há filtros aplicados

  return count
}

