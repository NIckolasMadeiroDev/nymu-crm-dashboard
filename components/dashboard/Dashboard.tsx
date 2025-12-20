'use client'

import { useEffect, useState, useCallback } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import MobileWarning from '@/components/ui/MobileWarning'
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
import SettingsModal from '@/components/settings/SettingsModal'
import HelpModal from '@/components/help/HelpModal'
import FiltersModal, { countActiveFilters } from '@/components/filters/FiltersModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWidgetHeight } from '@/contexts/WidgetHeightContext'
import type { DashboardData } from '@/types/dashboard'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import NymuLogo from '@/components/common/NymuLogo'
import { themeService } from '@/services/theme/theme-service'
import { dashboardPreferencesService } from '@/services/preferences/dashboard-preferences-service'
import { filterPresetsService } from '@/services/filters/filter-presets-service'
import type { DrillContext } from '@/services/drill/drill-service'

export default function Dashboard() {
  const { t } = useLanguage()
  useWidgetHeight() // Usado no SettingsModal através do contexto
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showScheduling, setShowScheduling] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [drillContext, setDrillContext] = useState<DrillContext | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  type LogoVariant = 'twocolor' | 'white'
  type ChartLayout = 'one' | 'two' | 'three'
  
  const [logoVariant, setLogoVariant] = useState<LogoVariant>('twocolor')
  const [chartLayout, setChartLayout] = useState<ChartLayout>('three')
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (isMobile) {
    return <MobileWarning />
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
          <section
            className="bg-white rounded-lg shadow-sm p-2 sm:p-2.5 border border-gray-100 mb-2 sm:mb-2.5 dark:bg-gray-800 dark:border-gray-700"
            aria-label="Controles do dashboard"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-0.5 sm:gap-1 items-center">
              <div className="col-span-1 w-auto flex items-center justify-start ml-3">
                <NymuLogo
                  variant={logoVariant}
                  type="logotype"
                  width={144}
                  height={36}
                  priority
                  className="focus:outline-none w-auto h-auto"
                  style={{ maxWidth: 'min(90px, 100%)' }}
                />
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 w-full flex items-center">
                <FilterPresets
                  onSelectPreset={handleFilterChange}
                  currentFilters={dashboardData.filters}
                  onPresetSelected={handlePresetSelected}
                />
              </div>
              <button
                onClick={() => setShowHelpModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowHelpModal(true)
                  }
                }}
                aria-label="Abrir ajuda"
                className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-secondary flex items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 whitespace-nowrap"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden md:inline truncate">Ajuda</span>
              </button>
              <button
                onClick={() => setShowFiltersModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowFiltersModal(true)
                  }
                }}
                aria-label="Abrir filtros"
                className="relative w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="hidden md:inline truncate">Filtros</span>
                {dashboardData && countActiveFilters(dashboardData.filters) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {countActiveFilters(dashboardData.filters)}
                  </span>
                )}
              </button>
              <div className="w-full">
                <ExportButton data={dashboardData} className="w-full" />
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowSettingsModal(true)
                  }
                }}
                aria-label="Abrir configurações"
                className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-secondary flex items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden md:inline truncate">Configurações</span>
              </button>
              <button
                onClick={() => setShowScheduling(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowScheduling(true)
                  }
                }}
                aria-label={t.scheduling.title}
                className="w-full px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden md:inline truncate">{t.scheduling.title}</span>
              </button>
              <div className="w-full">
                <ShareButton filters={dashboardData.filters} className="w-full" />
              </div>
            </div>
          </section>
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            chartLayout={chartLayout}
            onChartLayoutChange={(layout) => {
              setChartLayout(layout)
              dashboardPreferencesService.saveChartLayout(layout)
            }}
          />
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
          {dashboardData && (
            <FiltersModal
              isOpen={showFiltersModal}
              onClose={() => setShowFiltersModal(false)}
              filters={dashboardData.filters}
              onFilterChange={handleFilterChange}
              selectedPresetId={selectedPresetId}
              onPresetUpdated={() => {
                if (dashboardData) {
                  loadDashboardData(dashboardData.filters)
                }
              }}
            />
          )}
          {drillContext && (
            <DrillNavigation
              onContextChange={(context) => {
                setDrillContext(context)
                if (context) {
                  handleFilterChange({ ...dashboardData.filters, ...context.filters } as DashboardData['filters'])
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
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5 items-stretch">
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Leads Criados</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{formatNumber(dashboardData.generationActivation.leadsCreated)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Leads no Grupo</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{formatNumber(dashboardData.generationActivation.leadsInGroup)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Participantes no Meet</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{formatNumber(dashboardData.generationActivation.meetParticipants)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Vendas Fechadas</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{formatNumber(dashboardData.salesConversion.closedSales)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Taxa de Fechamento</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{dashboardData.salesConversion.closingRate.toFixed(0)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 md:p-2.5 border border-gray-100 flex flex-col justify-between min-w-0">
                <h3 className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1 truncate">Receita Gerada</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 font-primary break-words">{formatCurrency(dashboardData.salesConversion.revenueGenerated)}</p>
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

