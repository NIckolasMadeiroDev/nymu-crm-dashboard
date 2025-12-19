'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, X, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import {
  filterPresetsService,
  type FilterPreset,
} from '@/services/filters/filter-presets-service'
import { SDRS, COLLEGES, ORIGINS } from '@/services/dashboard-mock-service'

interface FilterPresetsProps {
  readonly onSelectPreset: (filters: DashboardFilters) => void
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
  const [showDialog, setShowDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null)

  useEffect(() => {
    setPresets(filterPresetsService.getPresets())
  }, [])

  const handleSelectPreset = (presetId: string) => {
    if (!presetId) {
      setSelectedPresetId(null)
      onPresetSelected?.(null)
      return
    }
    const preset = filterPresetsService.getPreset(presetId)
    if (preset) {
      setSelectedPresetId(presetId)
      onPresetSelected?.(presetId)
      onSelectPreset(preset.filters)
    }
  }

  const handleCreatePreset = () => {
    setEditingPreset(null)
    setShowDialog(true)
  }

  const handleEditPreset = (preset: FilterPreset) => {
    if (preset.isProtected) {
      toast.error('Este preset padrão não pode ser editado.')
      return
    }
    setEditingPreset(preset)
    setShowDialog(true)
  }

  const handleDeletePreset = (presetId: string) => {
    if (filterPresetsService.isPresetProtected(presetId)) {
      toast.error('Este preset padrão não pode ser excluído.')
      return
    }

    const preset = filterPresetsService.getPreset(presetId)
    const presetName = preset?.name || 'este preset'

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Confirmar exclusão</p>
          <p className="text-sm">
            Tem certeza que deseja excluir o preset &quot;{presetName}&quot;? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                try {
                  filterPresetsService.deletePreset(presetId)
      setPresets(filterPresetsService.getPresets())
                  
                  // Retornar ao preset "Hoje" automaticamente
                  const todayPreset = filterPresetsService.getPreset('preset-default-today')
                  if (todayPreset) {
                    setSelectedPresetId('preset-default-today')
                    onPresetSelected?.('preset-default-today')
                    onSelectPreset(todayPreset.filters)
                    toast.success('Preset excluído. Retornando ao preset "Hoje".')
                  } else {
                    setSelectedPresetId(null)
                    onPresetSelected?.(null)
                    toast.success('Preset excluído com sucesso.')
    }
                } catch (error: any) {
                  toast.error(error.message || 'Erro ao excluir preset.')
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Excluir
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
        icon: '🗑️',
      }
    )
  }

  const handleSavePreset = (name: string, filters: DashboardFilters) => {
    if (!name.trim()) {
      toast.error('Por favor, informe um nome para o preset.')
      return
    }

    try {
      if (editingPreset) {
        filterPresetsService.updatePreset(editingPreset.id, {
          name: name.trim(),
          filters,
        })
        setPresets(filterPresetsService.getPresets())
        setSelectedPresetId(editingPreset.id)
        onPresetSelected?.(editingPreset.id)
        // Aplicar filtros automaticamente
        onSelectPreset(filters)
        toast.success('Preset atualizado e filtros aplicados com sucesso!')
      } else {
        const newPreset = filterPresetsService.createPreset(name.trim(), filters)
      setPresets(filterPresetsService.getPresets())
        setSelectedPresetId(newPreset.id)
        onPresetSelected?.(newPreset.id)
        // Aplicar filtros automaticamente
        onSelectPreset(filters)
        toast.success('Preset criado e filtros aplicados com sucesso!')
      }
      setShowDialog(false)
      setEditingPreset(null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar preset.')
    }
  }

  const defaultPresets = presets.filter((p) => p.isProtected)
  const customPresets = presets.filter((p) => !p.isProtected)

  const selectedPreset = selectedPresetId
    ? presets.find((p) => p.id === selectedPresetId)
    : null
  const isCustomPresetSelected =
    selectedPreset && !selectedPreset.isProtected

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-1.5">
      <div className="relative w-auto">
      <select
          value={selectedPresetId || ''}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-auto min-w-[160px] px-2 py-2 border border-gray-300 rounded-lg text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isCustomPresetSelected && selectedPreset && (
          <>
            <button
              onClick={() => handleEditPreset(selectedPreset)}
              className="p-1 sm:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
              aria-label="Editar preset atual"
              title="Editar preset atual"
            >
              <Edit2 size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => handleDeletePreset(selectedPreset.id)}
              className="p-1 sm:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              aria-label="Excluir preset atual"
              title="Excluir preset atual"
            >
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </>
        )}
        <button
          onClick={handleCreatePreset}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center gap-1 whitespace-nowrap"
          aria-label="Criar novo preset"
        >
          <Plus size={16} className="text-white" />
          <span className="hidden sm:inline text-white">Novo Preset</span>
          <span className="sm:hidden text-white">Novo</span>
        </button>
      </div>

      {showDialog && (
        <PresetDialog
          preset={editingPreset}
          initialFilters={editingPreset?.filters || currentFilters}
          onClose={() => {
            setShowDialog(false)
            setEditingPreset(null)
          }}
          onSave={handleSavePreset}
        />
      )}
    </div>
  )
}

interface PresetDialogProps {
  readonly preset: FilterPreset | null
  readonly initialFilters: DashboardFilters
  readonly onClose: () => void
  readonly onSave: (name: string, filters: DashboardFilters) => void
}

function PresetDialog({
  preset,
  initialFilters,
  onClose,
  onSave,
}: Readonly<PresetDialogProps>) {
  const [name, setName] = useState(preset?.name || '')
  const [filters, setFilters] = useState<DashboardFilters>({ ...initialFilters })

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
                <label htmlFor="preset-season-select" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temporada
                </label>
                <select
                  id="preset-season-select"
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="2025.1">2025.1</option>
                  <option value="2024.2">2024.2</option>
                  <option value="2024.1">2024.1</option>
                  <option value="2023.2">2023.2</option>
                </select>
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
                  {SDRS.map((sdr) => (
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
                  {COLLEGES.map((college) => (
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
                  {ORIGINS.map((origin) => (
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
