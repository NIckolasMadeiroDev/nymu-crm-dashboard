'use client'

import { useEffect, useState, useCallback } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import DashboardFiltersComponent from './DashboardFilters'
import GenerationActivationWithControls from './GenerationActivationWithControls'
import SalesConversionWithControls from './SalesConversionWithControls'
import ConversionRatesWithControls from './ConversionRatesWithControls'
import LeadStockWithControls from './LeadStockWithControls'
import SalesByConversionTimeWithControls from './SalesByConversionTimeWithControls'
import LeadQualityWithControls from './LeadQualityWithControls'
import DraggableChart from './DraggableChart'
import ExportButton from '@/components/export/ExportButton'
import ShareButton from '@/components/sharing/ShareButton'
import SchedulingPanel from '@/components/scheduling/SchedulingPanel'
import FilterPresets from '@/components/filters/FilterPresets'
import DrillNavigation from '@/components/drill/DrillNavigation'
import ThemeSelector from '@/components/theme/ThemeSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import type { DashboardData } from '@/types/dashboard'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import NymuLogo from '@/components/common/NymuLogo'
import LanguageSelector from '@/components/language/LanguageSelector'
import { themeService } from '@/services/theme/theme-service'
import { dashboardPreferencesService } from '@/services/preferences/dashboard-preferences-service'
import { filterPresetsService } from '@/services/filters/filter-presets-service'

export default function Dashboard() {
  const { t } = useLanguage()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showScheduling, setShowScheduling] = useState(false)
  const [drillContext, setDrillContext] = useState<any>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  type LogoVariant = 'twocolor' | 'white'
  type ChartLayout = 'one' | 'two' | 'three'
  
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('twocolor')
  const [chartLayout, setChartLayout] = useState<ChartLayout>('three')
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)

  const defaultChartOrder = [
    'sales-conversion-chart',
    'sales-conversion-time-chart',
    'conversion-rates-widget',
    'lead-stock-chart',
    'generation-activation-chart',
    'lead-quality-widget',
  ]

  const [chartOrder, setChartOrder] = useState<string[]>(defaultChartOrder)

  useEffect(() => {
    const preferences = dashboardPreferencesService.getPreferences()
    if (preferences.chartLayout) {
      setChartLayout(preferences.chartLayout)
    }
    if (preferences.chartOrder && preferences.chartOrder.length > 0) {
      const savedOrder = preferences.chartOrder
      const missingCharts = defaultChartOrder.filter((id) => !savedOrder.includes(id))
      if (missingCharts.length === 0) {
        setChartOrder(savedOrder)
      } else {
        setChartOrder([...savedOrder, ...missingCharts])
      }
    }
    if (preferences.selectedPresetId !== null) {
      setSelectedPresetId(preferences.selectedPresetId)
      const preset = filterPresetsService.getPreset(preferences.selectedPresetId)
      if (preset) {
        loadDashboardData(preset.filters)
        return
      }
    }
    if (preferences.filters) {
      loadDashboardData(preferences.filters)
    }
  }, [])

  const handlePresetSelected = (presetId: string | null) => {
    setSelectedPresetId(presetId)
    dashboardPreferencesService.saveSelectedPresetId(presetId)
  }

  useEffect(() => {
    if (dashboardData?.filters) {
      dashboardPreferencesService.saveFilters(dashboardData.filters)
    }
  }, [dashboardData?.filters])

  const loadDashboardData = useCallback(async (filters?: DashboardData['filters']) => {
    try {
      setLoading(true)
      setError(null)

      const activeFilters = filters || dashboardData?.filters || {
        date: '2025-12-17',
        season: '2025.1',
        sdr: 'Todos',
        college: 'Todas',
        origin: '',
      }

      const data = await dataSourceAdapter.getDashboardData(activeFilters)
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [dashboardData?.filters])

  useEffect(() => {
    loadDashboardData()

    const interval = setInterval(loadDashboardData, 30000)

    return () => clearInterval(interval)
  }, [loadDashboardData])

  useEffect(() => {
    const updateLogoVariant = () => {
      const theme = themeService.getTheme()
      if (theme === 'dark') {
        setLogoVariant('white')
      } else {
        setLogoVariant('twocolor')
      }
    }

    updateLogoVariant()

    const handleStorageChange = () => {
      updateLogoVariant()
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('storage', handleStorageChange)
      const interval = setInterval(updateLogoVariant, 1000)

      return () => {
        globalThis.window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLayoutMenu) {
        setShowLayoutMenu(false)
      }
    }

    if (showLayoutMenu) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showLayoutMenu])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    loadDashboardData()
  }

  const handleFilterChange = (filters: DashboardData['filters']) => {
    dashboardPreferencesService.saveFilters(filters)
    loadDashboardData(filters)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = chartOrder.indexOf(active.id as string)
      const newIndex = chartOrder.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(chartOrder, oldIndex, newIndex)
        setChartOrder(newOrder)
        dashboardPreferencesService.saveChartOrder(newOrder)
      }
    }
  }

  const getGridClasses = () => {
    switch (chartLayout) {
      case 'one':
        return 'grid-cols-1'
      case 'two':
        return 'grid-cols-1 lg:grid-cols-2'
      case 'three':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return 'grid-cols-1 lg:grid-cols-2'
    }
  }


  // Função para renderizar um gráfico baseado no ID
  const renderChart = useCallback((chartId: string) => {
    if (!dashboardData) return null

    switch (chartId) {
      case 'sales-conversion-chart':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <SalesConversionWithControls
                data={dashboardData.salesConversion}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'sales-conversion-time-chart':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <SalesByConversionTimeWithControls
                data={dashboardData.salesByConversionTime}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'conversion-rates-widget':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <ConversionRatesWithControls
                data={dashboardData.conversionRates}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'lead-stock-chart':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <LeadStockWithControls
                data={dashboardData.leadStock}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'generation-activation-chart':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <GenerationActivationWithControls
                data={dashboardData.generationActivation}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'lead-quality-widget':
        return (
          <DraggableChart key={chartId} id={chartId}>
            {(dragHandleProps) => (
              <LeadQualityWithControls
                data={dashboardData.leadQuality}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      default:
        return null
    }
  }, [dashboardData])

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message={error} onRetry={handleRetry} />
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 lg:py-6" style={{ backgroundColor: 'var(--theme-background)' }}>
      <a href="#main-content" className="skip-to-main">
        Pular para conteúdo principal
      </a>
      <div className="w-full">
        <main id="main-content" role="main" aria-label="Dashboard principal do CRM">

        <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-6 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 flex-wrap flex-1 min-w-0">
              <div className="h-5 sm:h-6 md:h-8 flex items-center flex-shrink-0">
                <NymuLogo
                  variant={logoVariant}
                  type="logotype"
                  width={144}
                  height={36}
                  priority
                  className="focus:outline-none w-auto max-w-full h-auto"
                  style={{ maxWidth: 'min(100px, 100%)' }}
                />
              </div>
              <div className="flex-shrink-0">
                <LanguageSelector />
              </div>
              <div className="flex-1 min-w-0">
                <FilterPresets
                  onSelectPreset={handleFilterChange}
                  currentFilters={dashboardData.filters}
                  onPresetSelected={handlePresetSelected}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowLayoutMenu((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowLayoutMenu((prev) => !prev)
                    }
                    if (e.key === 'Escape') {
                      setShowLayoutMenu(false)
                    }
                  }}
                  className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Selecionar layout dos gráficos"
                  aria-expanded={showLayoutMenu}
                  aria-haspopup="true"
                >
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {(() => {
                      if (chartLayout === 'one') {
                        return (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 21a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z"
                          />
                        )
                      }
                      if (chartLayout === 'two') {
                        return (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          />
                        )
                      }
                      return (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM10 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM16 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM10 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM16 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      )
                    })()}
                  </svg>
                  <span className="hidden sm:inline text-white">
                    {(() => {
                      if (chartLayout === 'one') return '1 por linha'
                      if (chartLayout === 'two') return '2 por linha'
                      return '3 por linha'
                    })()}
                  </span>
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showLayoutMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowLayoutMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        {[
                          { value: 'one', label: '1 por linha', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 21a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z' },
                          { value: 'two', label: '2 por linha', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                          { value: 'three', label: '3 por linha', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM10 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM16 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM10 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM16 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              const newLayout = option.value as ChartLayout
                              setChartLayout(newLayout)
                              dashboardPreferencesService.saveChartLayout(newLayout)
                              setShowLayoutMenu(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                const newLayout = option.value as ChartLayout
                                setChartLayout(newLayout)
                                dashboardPreferencesService.saveChartLayout(newLayout)
                                setShowLayoutMenu(false)
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-secondary transition-colors ${
                              chartLayout === option.value
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            aria-label={`Layout ${option.label}`}
                            aria-pressed={chartLayout === option.value}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={option.icon}
                              />
                            </svg>
                            <span>{option.label}</span>
                            {chartLayout === option.value && (
                              <svg
                                className="w-4 h-4 ml-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowScheduling(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowScheduling(true)
                  }
                }}
                aria-label={t.scheduling.title}
                className="px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t.scheduling.title}
              </button>
              <ShareButton filters={dashboardData.filters} />
              <ExportButton data={dashboardData} />
              <div className="flex-shrink-0">
                <ThemeSelector />
              </div>
            </div>
          </div>
          <DashboardFiltersComponent
            filters={dashboardData.filters}
            onFilterChange={handleFilterChange}
            selectedPresetId={selectedPresetId}
            onPresetUpdated={() => {
              if (dashboardData) {
                loadDashboardData(dashboardData.filters)
              }
            }}
          />
          {drillContext && (
            <DrillNavigation
              onContextChange={(context) => {
                setDrillContext(context)
                if (context) {
                  handleFilterChange({ ...dashboardData.filters, ...context.filters } as any)
                }
              }}
            />
          )}
        </div>

        {showScheduling && (
          <SchedulingPanel
            filters={dashboardData.filters}
            onClose={() => setShowScheduling(false)}
          />
        )}

        {(() => {
          if (loading) {
            return (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600 font-secondary">{t.dashboard.loading}</span>
          </div>
            )
          }
          if (error) {
            return <ErrorMessage message={error || t.dashboard.error} onRetry={() => loadDashboardData()} />
          }
          return (
             <div 
               id="dashboard-export-container" 
               className="transition-all duration-300 space-y-3 sm:space-y-4 md:space-y-5"
             >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5 items-stretch">
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Leads Criados</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{formatNumber(dashboardData.generationActivation.leadsCreated)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Leads no Grupo</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{formatNumber(dashboardData.generationActivation.leadsInGroup)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Participantes no Meet</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{formatNumber(dashboardData.generationActivation.meetParticipants)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Vendas Fechadas</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{formatNumber(dashboardData.salesConversion.closedSales)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Taxa de Fechamento</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{dashboardData.salesConversion.closingRate.toFixed(0)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 md:p-3 lg:p-4 border border-gray-100 flex flex-col justify-between">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">Receita Gerada</h3>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-primary">{formatCurrency(dashboardData.salesConversion.revenueGenerated)}</p>
              </div>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
                <div className={`grid transition-all duration-300 ${getGridClasses()} auto-rows-min gap-2 sm:gap-2.5 md:gap-3 lg:gap-4`}>
                  {chartOrder.map((chartId) => renderChart(chartId))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          )
        })()}
        </main>
      </div>
    </div>
  )
}

