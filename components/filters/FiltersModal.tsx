'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Save, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import {
  filterPresetsService,
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
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [availableSdrs, setAvailableSdrs] = useState<string[]>([])
  const [availableColleges, setAvailableColleges] = useState<string[]>([])
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([])

  const calculateDateTo = useCallback((dateFrom: string): string => {
    if (!dateFrom) return ''
    const date = new Date(dateFrom)
    date.setDate(date.getDate() + (12 * 7))
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Inicializar filtros locais quando o modal abre ou quando os filtros externos mudam
  useEffect(() => {
    if (isOpen) {
      const initializedFilters = { ...filters }
      if (filters.date && !filters.dateTo) {
        initializedFilters.dateTo = calculateDateTo(filters.date)
      }
      setLocalFilters(initializedFilters)
      setIsApplyingFilters(false) // Resetar estado de loading ao abrir
    }
  }, [isOpen, filters, calculateDateTo])

  useEffect(() => {
    if (selectedPresetId) {
      const preset = filterPresetsService.getPreset(selectedPresetId)
      if (preset) {
        const filtersChanged =
          JSON.stringify(localFilters) !== JSON.stringify(preset.filters)
        setHasChanges(filtersChanged && !preset.isProtected)
      } else {
        setHasChanges(false)
      }
    } else {
      setHasChanges(false)
    }
  }, [localFilters, selectedPresetId])

  useEffect(() => {
    if (isOpen) {
      // Fetch available filters and panels
      const fetchFilters = async () => {
        try {
          const response = await fetch('/api/dashboard/filters')
          if (!response.ok) throw new Error('Failed to fetch filters')
          const filters = await response.json()
          
          setAvailableSdrs(filters.sdrs || [])
          setAvailableColleges(filters.colleges || [])
          setAvailableOrigins(filters.origins || [])
        } catch (error) {
          console.error('Error fetching filters:', error)
          setAvailableSdrs([])
          setAvailableColleges([])
          setAvailableOrigins([])
        }
      }
      fetchFilters()
    }
  }, [isOpen])

  const handleChange = (field: keyof DashboardFilters, value: string | undefined | string[]) => {
    const newFilters = { ...localFilters, [field]: value }
    if (field === 'date' && value && typeof value === 'string') {
      newFilters.dateTo = calculateDateTo(value)
    }
    setLocalFilters(newFilters)
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
                  filterPresetsService.updatePreset(selectedPresetId, { filters: localFilters })
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

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true)
    try {
      const mergedFilters: DashboardFilters = {
        ...localFilters,
        panelIds: localFilters.panelIds || filters.panelIds,
      }
      onFilterChange(mergedFilters)
      
      // Mostrar toast de confirmação
      toast.success('Filtros aplicados! Carregando dados...', {
        duration: 2000,
        icon: '✅',
      })
      
      // Aguardar um tempo mínimo para garantir que o usuário veja o feedback
      // e os dados comecem a carregar
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Fechar o modal após aplicar os filtros
      onClose()
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error)
      toast.error('Erro ao aplicar filtros. Tente novamente.')
      setIsApplyingFilters(false)
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 shadow-xl relative">
          {isApplyingFilters && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary">
                  Aplicando filtros...
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              id="filters-modal-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 dark:text-white"
            >
              Filtros
            </h2>
            <button
              onClick={onClose}
              disabled={isApplyingFilters}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                Data Inicial
              </label>
              <input
                id="filter-date"
                type="date"
                value={localFilters.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={isApplyingFilters}
                aria-label="Filtro de data inicial"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="filter-date-to"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Data Final (12 semanas)
              </label>
              <input
                id="filter-date-to"
                type="date"
                value={localFilters.dateTo || calculateDateTo(localFilters.date)}
                readOnly
                disabled
                aria-label="Filtro de data final (calculado automaticamente)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
              />
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
                value={localFilters.sdr}
                onChange={(e) => handleChange('sdr', e.target.value)}
                disabled={isApplyingFilters}
                aria-label="Filtro de SDR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Faculdade
              </label>
              <select
                id="filter-college"
                value={localFilters.college}
                onChange={(e) => handleChange('college', e.target.value)}
                disabled={isApplyingFilters}
                aria-label="Filtro de faculdade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary mb-2"
              >
                Origem
              </label>
              <select
                id="filter-origin"
                value={localFilters.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                disabled={isApplyingFilters}
                aria-label="Filtro de origem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreatePreset}
                disabled={isApplyingFilters}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  const today = new Date().toISOString().split('T')[0]
                  const defaultFilters: DashboardFilters = {
                    date: today,
                    dateTo: calculateDateTo(today),
                    sdr: 'Todos',
                    college: 'Todas',
                    origin: '',
                  }
                  setLocalFilters(defaultFilters)
                }}
                disabled={isApplyingFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Limpar filtros"
              >
                Limpar Filtros
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Resetar filtros locais para os valores atuais antes de fechar
                  setLocalFilters(filters)
                  setIsApplyingFilters(false)
                  onClose()
                }}
                disabled={isApplyingFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={isApplyingFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isApplyingFilters ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Aplicando...
                  </>
                ) : (
                  'Salvar Filtros'
                )}
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {showPresetDialog && (
        <PresetDialog
          preset={null}
          initialFilters={localFilters}
          onClose={() => setShowPresetDialog(false)}
          onSave={handleSavePreset}
        />
      )}
    </>
  )
}

export function countActiveFilters(filters: DashboardFilters): number {
  let count = 0


  if (filters.sdr && filters.sdr !== 'Todos') {
    count++
  }


  if (filters.college && filters.college !== 'Todas') {
    count++
  }


  if (filters.origin && filters.origin !== '') {
    count++
  }

  return count
}

