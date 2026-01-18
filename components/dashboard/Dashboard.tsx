'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { logout } from '@/services/auth/auth-service'
import { toast } from 'react-hot-toast'
import GenerationActivationWithControls from './GenerationActivationWithControls'
import SalesConversionWithControls from './SalesConversionWithControls'
import ConversionRatesWithControls from './ConversionRatesWithControls'
import LeadStockWithControls from './LeadStockWithControls'
import SalesByConversionTimeWithControls from './SalesByConversionTimeWithControls'
import LeadQualityWithControls from './LeadQualityWithControls'
import AttendancesByChannelWithControls from './AttendancesByChannelWithControls'
import CapacityOfAttendanceWithControls from './CapacityOfAttendanceWithControls'
import DraggableChart from './DraggableChart'
import ExportButton from '@/components/export/ExportButton'
import ShareButton from '@/components/sharing/ShareButton'
import FilterPresets from '@/components/filters/FilterPresets'
import DrillNavigation from '@/components/drill/DrillNavigation'
import SettingsModal from '@/components/settings/SettingsModal'
import HelpModal from '@/components/help/HelpModal'
import ContactsManagerDashboardModal from './ContactsManagerDashboardModal'
import CrmDropdownMenu from '@/components/crm/CrmDropdownMenu'
import DepartmentsManagerModal from '@/components/crm/DepartmentsManagerModal'
import FiltersModal, { countActiveFilters } from '@/components/filters/FiltersModal'
import ChartDetailsModal from './ChartDetailsModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWidgetHeight } from '@/contexts/WidgetHeightContext'
import { useChartMinimization } from '@/contexts/ChartMinimizationContext'
import type { DashboardData } from '@/types/dashboard'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import NymuLogo from '@/components/common/NymuLogo'
import { themeService } from '@/services/theme/theme-service'
import { dashboardPreferencesService } from '@/services/preferences/dashboard-preferences-service'
import { filterPresetsService } from '@/services/filters/filter-presets-service'
import type { DrillContext } from '@/services/drill/drill-service'
import type { CrmDeal } from '@/types/crm'
import type { HelenaContact } from '@/types/helena'

export default function Dashboard() {
  const { t } = useLanguage()
  const router = useRouter()
  useWidgetHeight() // Usado no SettingsModal através do contexto
  const { getDynamicSpan } = useChartMinimization()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermanentErrors, setHasPermanentErrors] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showContactsModal, setShowContactsModal] = useState(false)
  const [availablePanels, setAvailablePanels] = useState<Array<{ id: string; title: string; key: string }>>([])
  const [showDepartmentsModal, setShowDepartmentsModal] = useState(false)
  const [showChartDetailsModal, setShowChartDetailsModal] = useState(false)
  const [chartDetailsData, setChartDetailsData] = useState<{
    title: string
    period: { type: 'week' | 'days' | 'date'; value: string | number; label: string }
  } | null>(null)
  const [chartDeals, setChartDeals] = useState<CrmDeal[]>([])
  const [chartContacts, setChartContacts] = useState<HelenaContact[]>([])
  const [isLoadingChartDetails, setIsLoadingChartDetails] = useState(false)
  const [drillContext, setDrillContext] = useState<DrillContext | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  type LogoVariant = 'twocolor' | 'white'
  type ChartLayout = 'one' | 'two' | 'three'

  const [logoVariant, setLogoVariant] = useState<LogoVariant>('twocolor')
  const [chartLayout, setChartLayout] = useState<ChartLayout>('three')
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const defaultChartOrder = useMemo(() => [
    'sales-conversion-chart',
    'sales-conversion-time-chart',
    'conversion-rates-widget',
    'lead-stock-chart',
    'generation-activation-chart',
    'lead-quality-widget',
  ], [])

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

    let filtersToLoad: DashboardData['filters'] | undefined

    if (preferences.selectedPresetId !== null) {
      setSelectedPresetId(preferences.selectedPresetId)
      const preset = filterPresetsService.getPreset(preferences.selectedPresetId)
      if (preset) {
        filtersToLoad = preset.filters
      }
    }

    if (!filtersToLoad && preferences.filters) {
      filtersToLoad = preferences.filters
    }

    // Se não há filtros, buscar painel padrão
    if (filtersToLoad) {
      loadDashboardDataRef.current?.(filtersToLoad, false)
    } else {
      const loadDefaultFilters = async () => {
        try {
          const filtersResponse = await fetch('/api/dashboard/filters')
          if (filtersResponse.ok) {
            const filtersData = await filtersResponse.json()
            const panels = filtersData.panels || []
            const defaultPanel = panels.find((panel: { id: string; title: string; key: string }) => 
              panel.key === '02' || panel.title.includes('Máquina de Vendas')
            )
            
            const defaultFilters: DashboardData['filters'] = {
              date: '2025-12-17',
              season: '2025.1',
              sdr: 'Todos',
              college: 'Todas',
              origin: '',
              panelIds: defaultPanel ? [defaultPanel.id] : undefined,
            }
            
            loadDashboardDataRef.current?.(defaultFilters, false)
          } else {
            const defaultFilters: DashboardData['filters'] = {
              date: '2025-12-17',
              season: '2025.1',
              sdr: 'Todos',
              college: 'Todas',
              origin: '',
              panelIds: undefined,
          }
          loadDashboardDataRef.current?.(defaultFilters, false)
        }
      } catch (error) {
        console.error('Error loading default filters:', error)
        const defaultFilters: DashboardData['filters'] = {
          date: '2025-12-17',
          season: '2025.1',
          sdr: 'Todos',
          college: 'Todas',
          origin: '',
          panelIds: undefined,
        }
        loadDashboardDataRef.current?.(defaultFilters, false)
      }
      }
      
      loadDefaultFilters()
    }

  }, [defaultChartOrder])

  const handlePresetSelected = (presetId: string | null) => {
    setSelectedPresetId(presetId)
    dashboardPreferencesService.saveSelectedPresetId(presetId)
  }

  useEffect(() => {
    if (dashboardData?.filters) {
      dashboardPreferencesService.saveFilters(dashboardData.filters)
    }
  }, [dashboardData?.filters])

  const isPermanentError = (errorMessage: string): boolean => {
    const permanentErrorPatterns = [
      'Not Found',
      '404',
      'Forbidden',
      '403',
      'Unauthorized',
      '401',
    ]
    return permanentErrorPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  const hasPermanentErrorsRef = useRef(false)
  const isLoadingRef = useRef(false)
  const loadDashboardDataRef = useRef<((filters?: DashboardData['filters'], silent?: boolean) => Promise<void>) | null>(null)

  const handlePermanentError = useCallback((errorMessage: string) => {
    hasPermanentErrorsRef.current = true
    setHasPermanentErrors(true)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Permanent error detected:', errorMessage)
    }
  }, [])

  const clearPermanentError = useCallback(() => {
    hasPermanentErrorsRef.current = false
    setHasPermanentErrors(false)
  }, [])

  const checkDataErrors = useCallback((data: any) => {
    if (!data.errors) {
      clearPermanentError()
      return
    }

    const hasPermanent = Object.values(data.errors).some((err) =>
      err && isPermanentError(err as string)
    )

    if (hasPermanent) {
      handlePermanentError('Errors in data.errors')
    } else {
      clearPermanentError()
    }
  }, [handlePermanentError, clearPermanentError])

  const handleLoadError = useCallback((errorMessage: string, silent: boolean, hasExistingData: boolean) => {
    if (isPermanentError(errorMessage)) {
      handlePermanentError(errorMessage)
    }

    if (!silent || !hasExistingData) {
      setError(errorMessage)
    }
  }, [handlePermanentError])

  const loadDashboardData = useCallback(async (filters?: DashboardData['filters'], silent: boolean = false) => {
    if (hasPermanentErrorsRef.current || isLoadingRef.current) {
      return
    }

    const hasExistingData = dashboardData !== null
    const shouldShowLoading = !silent && !hasExistingData

    try {
      isLoadingRef.current = true
      if (shouldShowLoading) {
        setLoading(true)
      }
      setError(null)

      const activeFilters = filters || {
        date: '2025-12-17',
        season: '2025.1',
        sdr: 'Todos',
        college: 'Todas',
        origin: '',
        panelIds: undefined,
      }

      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: activeFilters }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to load dashboard data'
        handleLoadError(errorMessage, silent, hasExistingData)

        if (!silent || !hasExistingData) {
          throw new Error(errorMessage)
        }
        return
      }

      const data = await response.json()
      setDashboardData(data)
      checkDataErrors(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      handleLoadError(errorMessage, silent, hasExistingData)
    } finally {
      isLoadingRef.current = false
      if (shouldShowLoading) {
        setLoading(false)
      }
    }
  }, [handleLoadError, checkDataErrors, dashboardData])

  loadDashboardDataRef.current = loadDashboardData

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await fetch('/api/dashboard/filters')
        if (response.ok) {
          const filtersData = await response.json()
          setAvailablePanels(filtersData.panels || [])
        }
      } catch (error) {
        console.error('Error fetching panels:', error)
        setAvailablePanels([])
      }
    }
    fetchPanels()
  }, [])

  useEffect(() => {
    if (hasPermanentErrors) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Polling disabled due to permanent errors (404, etc.)')
      }
      return
    }

    // Increase polling interval to 60 seconds to reduce API load
    const intervalId = setInterval(() => {
      if (!hasPermanentErrorsRef.current) {
        loadDashboardDataRef.current?.()
      }
    }, 60000)

    return () => {
      clearInterval(intervalId)
    }
  }, [hasPermanentErrors])

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
    hasPermanentErrorsRef.current = false
    setHasPermanentErrors(false)
    setLoading(true)
    loadDashboardData()
  }

  const handleFilterChange = (filters: DashboardData['filters']) => {
    dashboardPreferencesService.saveFilters(filters)

    loadDashboardData(filters, true)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logout realizado com sucesso!')
    router.push('/login')
  }

  const handleChartDataPointClick = useCallback(
    async (chartTitle: string, period: { type: 'week' | 'days' | 'date'; value: string | number; label: string }) => {
      if (!dashboardData) return

      // Calcular label melhorado com range de datas
      let improvedLabel = period.label
      try {
        if (period.type === 'week' && typeof period.value === 'number') {
          const { getWeekDateRange, formatDateRange } = await import('@/utils/date-ranges')
          const { startDate, endDate } = getWeekDateRange(period.value)
          improvedLabel = `Sem ${period.value}: ${formatDateRange(startDate, endDate)}`
        } else if (period.type === 'days' && typeof period.value === 'number') {
          const { getDaysDateRange, formatDateRange } = await import('@/utils/date-ranges')
          const { startDate, endDate } = getDaysDateRange(period.value)
          improvedLabel = `${period.value} dias: ${formatDateRange(startDate, endDate)}`
        }
      } catch (error) {
        console.error('Error calculating date range:', error)
      }

      setChartDetailsData({ title: chartTitle, period: { ...period, label: improvedLabel } })
      setShowChartDetailsModal(true)
      setChartDeals([])
      setChartContacts([])
      setIsLoadingChartDetails(true)

      try {
        const chartTitleLower = chartTitle.toLowerCase()
        const isLeadsCreated = chartTitleLower.includes('leads criados') || chartTitleLower.includes('geração')
        const isLeadStock = chartTitleLower.includes('estoque de leads')
        const isSales = chartTitleLower.includes('vendas por semana') || chartTitleLower.includes('conversão de vendas')

        // Usar dados locais se disponíveis
        if (isLeadsCreated && dashboardData.leads && dashboardData.contacts && dashboardData.users) {
          // Filtrar leads localmente (Leads Criados por Semana)
          const filteredLeads = dashboardData.leads.filter((lead: {
            id: string
            title: string
            value: number
            stageId: string
            pipelineId: string
            createdAt: string
            updatedAt: string
            owner: string
            contactIds: string[]
          }) => {
            const dateField = lead.createdAt
            if (!dateField) return false

            const leadDate = new Date(dateField)

            if (period.type === 'week' && typeof period.value === 'number') {
              const now = Date.now()
              const cardTime = leadDate.getTime()
              const diffMs = now - cardTime
              const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
              const weekIndex = diffWeeks
              const requestedWeek = period.value
              return weekIndex === (requestedWeek - 1) && weekIndex >= 0 && weekIndex < 12
            } else if (period.type === 'days' && typeof period.value === 'number') {
              const days = period.value
              const now = new Date()
              const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
              return leadDate >= daysAgo && leadDate <= now
            } else if (period.type === 'date') {
              if (isLeadStock) return true
              const periodDate = new Date(period.value as string)
              return (
                leadDate.getFullYear() === periodDate.getFullYear() &&
                leadDate.getMonth() === periodDate.getMonth() &&
                leadDate.getDate() === periodDate.getDate()
              )
            }
            return false
          })

          // Enriquecer leads com informações formatadas
          const { formatCurrency } = await import('@/utils/format-currency')
          const enrichedDeals = filteredLeads.map((lead: {
            id: string
            title: string
            value: number
            stageId: string
            pipelineId: string
            createdAt: string
            updatedAt: string
            owner: string
            contactIds: string[]
          }) => {
            const leadDate = new Date(lead.createdAt)
            const contact = dashboardData.contacts?.find((c: { id: string; name: string; email?: string; phone?: string }) => lead.contactIds?.includes(c.id))
            const user = dashboardData.users?.find((u: { id: string; name: string; email?: string }) => u.id === lead.owner)

            return {
              ...lead,
              createdAtFormatted: lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null,
              updatedAtFormatted: lead.updatedAt
                ? new Date(lead.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null,
              valueFormatted: formatCurrency(lead.value || 0),
              contactName: contact?.name || lead.title || 'Sem contato associado',
              contactEmail: contact?.email || undefined,
              contactPhone: contact?.phoneNumber || contact?.phone || undefined,
              ownerName: user?.name || lead.owner || 'Não atribuído',
              ownerEmail: user?.email || undefined,
              relevantDate: leadDate.toISOString(),
              relevantDateFormatted: leadDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          })

          setChartDeals(enrichedDeals as CrmDeal[])
          // Converter contatos para formato HelenaContact completo
          const allContacts = dashboardData.contacts || []
          setChartContacts(allContacts.map((c) => ({
            id: c.id,
            name: c.name || '',
            email: c.email ?? undefined,
            phoneNumber: c.phoneNumber || c.phone || '',
            phoneNumberFormatted: c.phoneNumberFormatted || c.phoneNumber || c.phone || '',
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
            companyId: c.companyId || '',
            status: c.status || 'active',
            tags: c.tags || [],
            customFields: c.customFields || {},
          })) as HelenaContact[])
        } else if (isSales && dashboardData.deals && dashboardData.contacts && dashboardData.users) {
          // Filtrar deals localmente (Vendas por Semana)
          const filteredDeals = dashboardData.deals.filter((deal: {
            id: string
            title: string
            value: number
            stageId: string
            pipelineId: string
            createdAt: string
            updatedAt: string
            closedAt?: string
            owner: string
            contactIds: string[]
          }) => {
            const dateField = deal.closedAt || deal.updatedAt
            if (!dateField) return false

            const dealDate = new Date(dateField)

            if (period.type === 'week' && typeof period.value === 'number') {
              const now = Date.now()
              const cardTime = dealDate.getTime()
              const diffMs = now - cardTime
              const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
              const weekIndex = diffWeeks
              const requestedWeek = period.value
              return weekIndex === (requestedWeek - 1) && weekIndex >= 0 && weekIndex < 12
            } else if (period.type === 'days' && typeof period.value === 'number') {
              const days = period.value
              const now = new Date()
              const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
              return dealDate >= daysAgo && dealDate <= now
            } else if (period.type === 'date') {
              const periodDate = new Date(period.value as string)
              return (
                dealDate.getFullYear() === periodDate.getFullYear() &&
                dealDate.getMonth() === periodDate.getMonth() &&
                dealDate.getDate() === periodDate.getDate()
              )
            }
            return false
          })

          // Enriquecer deals com informações formatadas
          const { formatCurrency } = await import('@/utils/format-currency')
          const enrichedDeals = filteredDeals.map((deal: {
            id: string
            title: string
            value: number
            stageId: string
            pipelineId: string
            createdAt: string
            updatedAt: string
            closedAt?: string
            owner: string
            contactIds: string[]
          }) => {
            const dealDate = new Date(deal.closedAt || deal.updatedAt)
            const contact = dashboardData.contacts?.find((c: { id: string; name: string; email?: string; phone?: string }) => deal.contactIds?.includes(c.id))
            const user = dashboardData.users?.find((u: { id: string; name: string; email?: string }) => u.id === deal.owner)

            return {
              ...deal,
              createdAtFormatted: deal.createdAt
                ? new Date(deal.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null,
              closedAtFormatted: deal.closedAt
                ? new Date(deal.closedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null,
              updatedAtFormatted: deal.updatedAt
                ? new Date(deal.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null,
              valueFormatted: formatCurrency(deal.value || 0),
              contactName: contact?.name || deal.title || 'Sem contato associado',
              contactEmail: contact?.email || undefined,
              contactPhone: contact?.phoneNumber || contact?.phone || undefined,
              ownerName: user?.name || deal.owner || 'Não atribuído',
              ownerEmail: user?.email || undefined,
              relevantDate: dealDate.toISOString(),
              relevantDateFormatted: dealDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          })

          setChartDeals(enrichedDeals as CrmDeal[])
          // Converter contatos para formato HelenaContact completo
          const allContacts = dashboardData.contacts || []
          setChartContacts(allContacts.map((c) => ({
            id: c.id,
            name: c.name || '',
            email: c.email ?? undefined,
            phoneNumber: c.phoneNumber || c.phone || '',
            phoneNumberFormatted: c.phoneNumberFormatted || c.phoneNumber || c.phone || '',
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
            companyId: c.companyId || '',
            status: c.status || 'active',
            tags: c.tags || [],
            customFields: c.customFields || {},
          })) as HelenaContact[])
        } else {
          // Fallback para API se dados locais não estiverem disponíveis
          const response = await fetch('/api/dashboard/deals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              period,
              filters: dashboardData.filters,
              chartTitle: chartTitle,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setChartDeals(data.deals || [])
            setChartContacts(data.contacts || [])
          } else {
            console.error('Failed to fetch deals')
          }
        }
      } catch (error) {
        console.error('Error filtering deals:', error)
      } finally {
        setIsLoadingChartDetails(false)
      }
    },
    [dashboardData]
  )

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
        return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2'
      case 'three':
        return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      default:
        return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2'
    }
  }

  const renderChart = useCallback((chartId: string) => {
    if (!dashboardData) return null

    const dynamicSpan = getDynamicSpan(chartId, chartOrder, chartLayout)

    switch (chartId) {
      case 'sales-conversion-chart':
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <SalesConversionWithControls
                data={dashboardData.salesConversion}
                dragHandleProps={dragHandleProps}
                onDataPointClick={(week: number, label: string) =>
                  handleChartDataPointClick('Vendas por Semana', {
                    type: 'week',
                    value: week,
                    label,
                  })
                }
              />
            )}
          </DraggableChart>
        )
      case 'sales-conversion-time-chart':
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <SalesByConversionTimeWithControls
                data={dashboardData.salesByConversionTime}
                dragHandleProps={dragHandleProps}
                onDataPointClick={(days: number, seriesKey: string, seriesName: string) =>
                  handleChartDataPointClick('Vendas por Tempo de Conversão', {
                    type: 'days',
                    value: days,
                    label: `${seriesName} - ${days} dias`,
                  })
                }
              />
            )}
          </DraggableChart>
        )
      case 'conversion-rates-widget':
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
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
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <LeadStockWithControls
                data={dashboardData.leadStock}
                dragHandleProps={dragHandleProps}
                onDataPointClick={(category: string, label: string) =>
                  handleChartDataPointClick('Estoque de Leads', {
                    type: 'date',
                    value: category,
                    label: `${label} - Estoque de Leads`,
                  })
                }
              />
            )}
          </DraggableChart>
        )
      case 'generation-activation-chart':
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <GenerationActivationWithControls
                data={dashboardData.generationActivation}
                dragHandleProps={dragHandleProps}
                onDataPointClick={(week: number, label: string) =>
                  handleChartDataPointClick('Leads Criados por Semana', {
                    type: 'week',
                    value: week,
                    label,
                  })
                }
              />
            )}
          </DraggableChart>
        )
      case 'lead-quality-widget':
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <LeadQualityWithControls
                data={dashboardData.leadQuality}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      case 'attendances-by-channel-chart': {
        const operational = dashboardData.operational
        if (!operational?.channels) return null
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <AttendancesByChannelWithControls
                data={operational.channels}
                dragHandleProps={dragHandleProps}
                onDataPointClick={(channel: string, label: string) =>
                  handleChartDataPointClick('Atendimentos por Canal', {
                    type: 'date',
                    value: channel,
                    label: `${label} - Atendimentos por Canal`,
                  })
                }
              />
            )}
          </DraggableChart>
        )
      }
      case 'capacity-of-attendance-widget': {
        const operational = dashboardData.operational
        if (!operational?.capacity) return null
        return (
          <DraggableChart key={chartId} id={chartId} span={dynamicSpan}>
            {(dragHandleProps) => (
              <CapacityOfAttendanceWithControls
                data={operational.capacity}
                dragHandleProps={dragHandleProps}
              />
            )}
          </DraggableChart>
        )
      }
      default:
        return null
    }
  }, [dashboardData, chartOrder, chartLayout, getDynamicSpan, handleChartDataPointClick])

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

  const hasErrors = dashboardData?.errors && Object.keys(dashboardData.errors).length > 0

  if (!dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6" style={{ backgroundColor: 'var(--theme-background)' }}>
      <a href="#main-content" className="skip-to-main">
        Pular para conteúdo principal
      </a>
      <div className="w-auto min-w-0">
        <main id="main-content" role="main" aria-label="Dashboard principal do CRM">
        {hasErrors && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Avisos de carregamento de dados
                </h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {dashboardData.errors?.cards && (
                    <li>• Cards: {dashboardData.errors.cards}</li>
                  )}
                  {dashboardData.errors?.contacts && (
                    <li>• Contatos: {dashboardData.errors.contacts}</li>
                  )}
                  {dashboardData.errors?.panels && (
                    <li>• Painéis: {dashboardData.errors.panels}</li>
                  )}
                  {dashboardData.errors?.wallets && (
                    <li>• Carteiras: {dashboardData.errors.wallets}</li>
                  )}
                </ul>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Alguns dados podem estar incompletos, mas o dashboard continua funcionando com os dados disponíveis.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 space-y-3 sm:space-y-4 md:space-y-5">
          <section
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 sm:p-3 md:p-3 border border-gray-100 dark:border-gray-700 mb-2 sm:mb-3"
            aria-label="Controles do dashboard"
          >
            <div className="flex flex-nowrap gap-1 overflow-x-auto py-1 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 sm:gap-2 sm:overflow-visible sm:py-0 items-center justify-start">
              <div className="flex items-center justify-center col-span-1 px-1">
                <NymuLogo
                  variant={logoVariant}
                  type="logotype"
                  width={120}
                  height={30}
                  priority
                  className="focus:outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1 w-auto min-w-0 flex items-center">
                <FilterPresets
                  onSelectPreset={handleFilterChange}
                  currentFilters={dashboardData.filters}
                  onPresetSelected={handlePresetSelected}
                />
              </div>
              <CrmDropdownMenu
                onContactsClick={() => setShowContactsModal(true)}
                onPanelsClick={() => {}}
                onDepartmentsClick={() => setShowDepartmentsModal(true)}
              />
              <button
                onClick={() => setShowHelpModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowHelpModal(true)
                  }
                }}
                aria-label="Abrir ajuda"
                className="w-auto min-w-0 px-1.5 sm:px-2 md:px-2 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-secondary flex items-center justify-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 whitespace-nowrap"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline truncate">Ajuda</span>
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
                className="relative w-auto min-w-0 px-1.5 sm:px-2 md:px-2 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center justify-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="hidden sm:inline truncate">Filtros</span>
                {dashboardData && countActiveFilters(dashboardData.filters) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] sm:text-[8px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                    {countActiveFilters(dashboardData.filters)}
                  </span>
                )}
              </button>
              <div className="col-span-2 sm:col-span-1 w-auto min-w-0">
                <ExportButton data={dashboardData} className="w-auto min-w-0" />
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
                className="w-auto min-w-0 px-1.5 sm:px-2 md:px-2 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-secondary flex items-center justify-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 whitespace-nowrap"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="hidden sm:inline truncate">Config</span>
              </button>
              <div className="relative w-auto min-w-0">
                <select
                  value={(() => {
                    const panelIds = dashboardData?.filters?.panelIds
                    if (panelIds?.length === 1) {
                      return panelIds[0]
                    }
                    // Se não há painel selecionado, buscar o padrão "02 Máquina de Vendas"
                    const defaultPanel = availablePanels.find((panel) => 
                      panel.key === '02' || panel.title.includes('Máquina de Vendas')
                    )
                    return defaultPanel?.id || 'all'
                  })()}
                  onChange={(e) => {
                    const panelId = e.target.value
                    const currentFilters = dashboardData?.filters || {
                      date: '2025-12-17',
                      season: '2025.1',
                      sdr: 'Todos',
                      college: 'Todas',
                      origin: '',
                    }
                    const newFilters: DashboardData['filters'] = {
                      ...currentFilters,
                      panelIds: panelId === 'all' ? undefined : [panelId],
                    }
                    handleFilterChange(newFilters)
                  }}
                  aria-label="Selecionar painel"
                  className="w-44 min-w-0 pl-1.5 sm:pl-2 md:pl-2 pr-5 sm:pr-6 md:pr-6 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 whitespace-nowrap border-0 cursor-pointer appearance-none truncate"
                >
                  <option value="all">Todos os painéis</option>
                  {availablePanels.map((panel) => (
                    <option key={panel.id} value={panel.id} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
                      {panel.title} ({panel.key})
                    </option>
                  ))}
                </select>
                <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 w-auto min-w-0">
                <ShareButton filters={dashboardData.filters} className="w-auto min-w-0" />
              </div>
              <button
                onClick={handleLogout}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleLogout()
                  }
                }}
                aria-label="Sair"
                className="w-auto min-w-0 px-1.5 sm:px-2 md:px-2 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-secondary flex items-center justify-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 whitespace-nowrap"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline truncate">Sair</span>
              </button>
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
          <ContactsManagerDashboardModal
            open={showContactsModal}
            onClose={() => setShowContactsModal(false)}
          />
          <DepartmentsManagerModal
            open={showDepartmentsModal}
            onClose={() => setShowDepartmentsModal(false)}
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

                  loadDashboardData(dashboardData.filters, true)
                }
              }}
            />
          )}
          {drillContext && (
            <DrillNavigation
              onContextChange={(context) => {
                setDrillContext(context)
                if (context) {

                  loadDashboardData({ ...dashboardData.filters, ...context.filters } as DashboardData['filters'], true)
                }
              }}
            />
          )}
          {chartDetailsData && (
            <ChartDetailsModal
              isOpen={showChartDetailsModal}
              onClose={() => {
                setShowChartDetailsModal(false)
                setChartDetailsData(null)
                setIsLoadingChartDetails(false)
              }}
              title={chartDetailsData.title}
              period={chartDetailsData.period}
              deals={chartDeals}
              contacts={chartContacts}
              isLoading={isLoadingChartDetails}
            />
          )}
        </div>

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
               className="transition-all duration-300 space-y-4 sm:space-y-4 md:space-y-5"
             >
            <div
  className="flex flex-row gap-2 items-stretch overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 sm:grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 sm:overflow-visible min-w-0"
  style={{ WebkitOverflowScrolling: 'touch' }}
>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Leads Criados</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.leadsCreated)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Leads no Grupo</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.leadsInGroup)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Participantes no Meet</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.meetParticipants)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Vendas Fechadas</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.salesConversion.closedSales)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Taxa de Fechamento</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{dashboardData.salesConversion.closingRate.toFixed(0)}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Receita Gerada</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatCurrency(dashboardData.salesConversion.revenueGenerated)}</p>
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

