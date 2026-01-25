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
import PanelsManagerModal from '@/components/crm/PanelsManagerModal'
import FiltersModal, { countActiveFilters } from '@/components/filters/FiltersModal'
import ChartDetailsModal from './ChartDetailsModal'
import CardDetailsModal from './CardDetailsModal'
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
  useWidgetHeight()
  const { getDynamicSpan } = useChartMinimization()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFiltersInfo, setShowFiltersInfo] = useState(false)
  const [hasPermanentErrors, setHasPermanentErrors] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showContactsModal, setShowContactsModal] = useState(false)
  const [availablePanels, setAvailablePanels] = useState<Array<{ id: string; title: string; key: string }>>([])
  const [showPanelsModal, setShowPanelsModal] = useState(false)
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
  const [showCardDetailsModal, setShowCardDetailsModal] = useState(false)
  const [cardDetailsType, setCardDetailsType] = useState<'leadsCreated' | 'leadsInGroup' | 'meetParticipants' | 'closedSales' | 'revenue' | null>(null)
  const [cardDetailsData, setCardDetailsData] = useState<any[]>([])
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(false)
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
    const isNotificationEnabled = dashboardPreferencesService.isRandomFilterNotificationEnabled()
    setShowFiltersInfo(isNotificationEnabled)

    const handlePreferenceChange = () => {
      const enabled = dashboardPreferencesService.isRandomFilterNotificationEnabled()
      setShowFiltersInfo(enabled)
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('storage', handlePreferenceChange)
      globalThis.window.addEventListener('random-filter-notification-changed', handlePreferenceChange as EventListener)
    }

    const initializeChartOrder = () => {
      if (!preferences.chartOrder || preferences.chartOrder.length === 0) return
      
      const savedOrder = preferences.chartOrder
      const missingCharts = defaultChartOrder.filter((id) => !savedOrder.includes(id))
      if (missingCharts.length === 0) {
        setChartOrder(savedOrder)
      } else {
        setChartOrder([...savedOrder, ...missingCharts])
      }
    }
    
    initializeChartOrder()

    const findDefaultPanel = (panels: Array<{ id: string; title: string; key: string }>) => {
      return panels.find((panel) => 
        panel.key === '02' || panel.title.includes('Máquina de Vendas')
      )
    }

    const createDefaultFilters = (panelId?: string): DashboardData['filters'] => ({
      date: '2025-12-17',
      sdr: 'Todos',
      college: 'Todas',
      origin: '',
      panelIds: panelId ? [panelId] : undefined,
    })

    const loadFiltersWithDefaultPanel = async (currentFilters: DashboardData['filters']) => {
      try {
        const filtersResponse = await fetch('/api/dashboard/filters')
        if (!filtersResponse.ok) {
          loadDashboardDataRef.current?.(currentFilters, false)
          return
        }
        
        const filtersData = await filtersResponse.json()
        const panels = filtersData.panels || []
        const defaultPanel = findDefaultPanel(panels)
        
        if (defaultPanel) {
          const updatedFilters: DashboardData['filters'] = {
            date: currentFilters.date || '2025-12-17',
            sdr: currentFilters.sdr || 'Todos',
            college: currentFilters.college || 'Todas',
            origin: currentFilters.origin || '',
            dateTo: currentFilters.dateTo,
            panelIds: [defaultPanel.id],
          }
          dashboardPreferencesService.saveFilters(updatedFilters)
          loadDashboardDataRef.current?.(updatedFilters, false)
        } else {
          loadDashboardDataRef.current?.(currentFilters, false)
        }
      } catch (error) {
        console.error('Error loading default panel:', error)
        loadDashboardDataRef.current?.(currentFilters, false)
      }
    }

    const loadDefaultFilters = async () => {
      try {
        const filtersResponse = await fetch('/api/dashboard/filters')
        if (!filtersResponse.ok) {
          loadDashboardDataRef.current?.(createDefaultFilters(), false)
          return
        }
        
        const filtersData = await filtersResponse.json()
        const panels = filtersData.panels || []
        const defaultPanel = findDefaultPanel(panels)
        const defaultFilters = createDefaultFilters(defaultPanel?.id)
        
        if (defaultPanel) {
          dashboardPreferencesService.saveFilters(defaultFilters)
        }
        
        loadDashboardDataRef.current?.(defaultFilters, false)
      } catch (error) {
        console.error('Error loading default filters:', error)
        loadDashboardDataRef.current?.(createDefaultFilters(), false)
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

    if (filtersToLoad) {
      if (!filtersToLoad.panelIds || filtersToLoad.panelIds.length === 0) {
        loadFiltersWithDefaultPanel(filtersToLoad)
      } else {
        loadDashboardDataRef.current?.(filtersToLoad, false)
      }
    } else {
      loadDefaultFilters()
    }

    return () => {
      if (globalThis.window !== undefined) {
        globalThis.window.removeEventListener('storage', handlePreferenceChange)
        globalThis.window.removeEventListener('random-filter-notification-changed', handlePreferenceChange as EventListener)
      }
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

      const activeFilters = filters || dashboardData?.filters || {
        date: '2025-12-17',
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
    if (dashboardData && availablePanels.length === 0) {
      const fetchPanels = async () => {
        try {
          const response = await fetch('/api/dashboard/filters')
          if (response.ok) {
            const filtersData = await response.json()
            setAvailablePanels(filtersData.panels || [])
          }
        } catch (error) {
          console.error('Error fetching panels:', error)
        }
      }
      fetchPanels()
    }
  }, [dashboardData, availablePanels.length])

  useEffect(() => {
    if (hasPermanentErrors) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Polling disabled due to permanent errors (404, etc.)')
      }
      return
    }

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

  const handlePanelChange = async (panelId: string) => {
    try {
      setLoadingPanel(true)
      const currentFilters = dashboardData?.filters
      const newFilters: DashboardData['filters'] = {
        date: currentFilters?.date || '2025-12-17',
        sdr: currentFilters?.sdr || 'Todos',
        college: currentFilters?.college || 'Todas',
        origin: currentFilters?.origin || '',
        dateTo: currentFilters?.dateTo,
        panelIds: panelId === 'all' ? undefined : [panelId],
      }
      dashboardPreferencesService.saveFilters(newFilters)
      await loadDashboardData(newFilters, true)
    } finally {
      setLoadingPanel(false)
    }
  }

  const filtersDisplay = useMemo(() => {
    if (!dashboardData?.filters) return 'Carregando filtros...'

    const filters = dashboardData.filters
    const parts: string[] = []

    if (filters.date) {
      const [year, month, day] = filters.date.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      
      const dateTo = filters.dateTo || (() => {
        const endDate = new Date(dateObj)
        endDate.setMonth(endDate.getMonth() + 6)
        return endDate.toISOString().split('T')[0]
      })()
      
      const [yearTo, monthTo, dayTo] = dateTo.split('-').map(Number)
      const dateToObj = new Date(yearTo, monthTo - 1, dayTo)
      const formattedDateTo = dateToObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      
      parts.push(`Período: ${formattedDate} a ${formattedDateTo}`)
    }

    if (filters.sdr && filters.sdr !== 'Todos') {
      parts.push(`SDR: ${filters.sdr}`)
    }

    if (filters.college && filters.college !== 'Todas') {
      parts.push(`Faculdade: ${filters.college}`)
    }

    if (filters.origin && filters.origin.trim() !== '') {
      parts.push(`Origem: ${filters.origin}`)
    }

    if (filters.panelIds && filters.panelIds.length > 0) {
      const panelId = filters.panelIds[0]
      const selectedPanel = availablePanels.find((panel) => panel.id === panelId)
      
      if (selectedPanel) {
        parts.push(`Painel: ${selectedPanel.title} (${selectedPanel.key})`)
      } else if (availablePanels.length > 0) {
        parts.push(`Painel: ${panelId}`)
      }
    } else {
      parts.push('Painel: Todos os painéis')
    }

    if (parts.length === 0) {
      return 'Todos os filtros padrão aplicados'
    }

    return parts.join(' • ')
  }, [dashboardData?.filters, availablePanels])

  const handleLogout = () => {
    logout()
    toast.success('Logout realizado com sucesso!')
    router.push('/login')
  }

  const handleLeadQualityClick = useCallback(async (origin: string) => {
    if (!dashboardData) return

    setCardDetailsType('leadsCreated')
    setShowCardDetailsModal(true)
    setIsLoadingCardDetails(true)

    try {
      const { helenaServiceFactory } = await import('@/services/helena/helena-service-factory')
      const panelsService = helenaServiceFactory.getPanelsService()
      const panels = await panelsService.getPanelsWithDetails()

      const stepMap = new Map<string, { title: string; panelId: string; panelTitle: string; panelKey: string }>()
      
      panels.forEach((panel: any) => {
        if (panel.steps && Array.isArray(panel.steps)) {
          panel.steps.forEach((step: any) => {
            if (step.id && !step.archived) {
              stepMap.set(step.id, {
                title: step.title || step.name || '',
                panelId: panel.id,
                panelTitle: panel.title || '',
                panelKey: panel.key || '',
              })
            }
          })
        }
      })

      const cards = dashboardData.cards || []
      const contacts = dashboardData.contacts || []

      const panelMap = new Map<string, { key: string; title: string }>()
      panels.forEach((panel: any) => {
        if (panel.id) {
          panelMap.set(panel.id, {
            key: panel.key || panel.id,
            title: panel.title || 'Painel Desconhecido',
          })
        }
      })

      const filteredCards = cards.filter((card: any) => {
        if (card.archived) return false
        
        const panelId = card.panelId || card.pipelineId || ''
        const stepId = card.stepId || card.stageId || ''
        const stepInfo = stepMap.get(stepId)
        const panelInfo = panelMap.get(panelId)
        
        if (!panelInfo) return false
        
        let groupKey = 'Sem categoria'
        if (panelInfo && stepInfo) {
          const panelLabel = panelInfo.key ? `Painel ${panelInfo.key}` : panelInfo.title
          const stepTitle = stepInfo.title || 'Sem etapa'
          groupKey = `${panelLabel} - ${stepTitle}`
        } else if (panelInfo && !stepInfo) {
          const panelLabel = panelInfo.key ? `Painel ${panelInfo.key}` : panelInfo.title
          groupKey = `${panelLabel} - Sem etapa`
        }
        
        return groupKey === origin
      })

      const cardsToDisplay = filteredCards.map((card: any) => {
        const stepInfo = stepMap.get(card.stepId || '')
        return {
          id: card.id,
          title: card.title || '',
          value: card.monetaryAmount || 0,
          stageId: card.stepId || '',
          pipelineId: card.panelId || '',
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          owner: card.responsibleUserId || '',
          contactIds: card.contactIds || [],
          panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
          panelKey: stepInfo?.panelKey || '',
          stepTitle: stepInfo?.title || 'Etapa não encontrada',
        }
      })

      setCardDetailsData(cardsToDisplay)
      setChartContacts(contacts.map((c) => ({
        id: c.id,
        name: c.name || '',
        email: c.email,
        phoneNumber: c.phoneNumber || c.phone || '',
        phoneNumberFormatted: c.phoneNumberFormatted || c.phoneNumber || c.phone || '',
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
        companyId: c.companyId || '',
        status: c.status || 'active',
        tags: c.tags || [],
        customFields: c.customFields || {},
      })))
    } catch (error) {
      console.error('Erro ao processar detalhes dos leads de qualidade:', error)
      toast.error('Erro ao processar detalhes dos leads')
      setCardDetailsData([])
    } finally {
      setIsLoadingCardDetails(false)
    }
  }, [dashboardData])

  const handleCardClick = async (cardType: 'leadsCreated' | 'leadsInGroup' | 'meetParticipants' | 'closedSales' | 'revenue') => {
    if (!dashboardData) return

    setCardDetailsType(cardType)
    setShowCardDetailsModal(true)
    setIsLoadingCardDetails(true)

    try {
      const { helenaServiceFactory } = await import('@/services/helena/helena-service-factory')
      const panelsService = helenaServiceFactory.getPanelsService()
      const panels = await panelsService.getPanelsWithDetails()

      const stepMap = new Map<string, { title: string; panelId: string; panelTitle: string; panelKey: string }>()
      
      panels.forEach((panel: any) => {
        if (panel.steps && Array.isArray(panel.steps)) {
          panel.steps.forEach((step: any) => {
            if (step.id && !step.archived) {
              stepMap.set(step.id, {
                title: step.title || step.name || '',
                panelId: panel.id,
                panelTitle: panel.title || '',
                panelKey: panel.key || '',
              })
            }
          })
        }
      })

      const filteredPanelIds = dashboardData.filters?.panelIds
      const isPanelFiltered = filteredPanelIds && filteredPanelIds.length > 0

      let cardsToDisplay: any[] = []
      const cards = dashboardData.cards || []
      const deals = dashboardData.deals || []
      const contacts = dashboardData.contacts || []

      switch (cardType) {
        case 'leadsCreated': {
          let filteredCards = cards
          
          if (isPanelFiltered) {
            filteredCards = cards.filter((card: any) => {
              const cardPanelId = card.panelId || ''
              return filteredPanelIds.includes(cardPanelId)
            })
          }
          
          cardsToDisplay = filteredCards.map((card: any) => {
            const stepInfo = stepMap.get(card.stepId || '')
            return {
              id: card.id,
              title: card.title || '',
              value: card.monetaryAmount || 0,
              stageId: card.stepId || '',
              pipelineId: card.panelId || '',
              createdAt: card.createdAt,
              updatedAt: card.updatedAt,
              owner: card.responsibleUserId || '',
              contactIds: card.contactIds || [],
              panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
              panelKey: stepInfo?.panelKey || '',
              stepTitle: stepInfo?.title || 'Etapa não encontrada',
            }
          })
          break
        }

        case 'leadsInGroup': {
          const filteredPanelIds = dashboardData.filters?.panelIds
          const isPanelFiltered = filteredPanelIds && filteredPanelIds.length > 0
          
          const panelsToSearch = isPanelFiltered
            ? panels.filter((p: any) => filteredPanelIds.includes(p.id))
            : panels

          const grupoStepIds = new Set<string>()
          panelsToSearch.forEach((panel: any) => {
            panel.steps?.forEach((step: any) => {
              const stepTitle = (step.title || step.name || '').toLowerCase()
              if (stepTitle.includes('entrou no grupo')) {
                if (step.id) grupoStepIds.add(step.id)
              }
            })
          })

          cardsToDisplay = cards
            .filter((card: any) => {
              if (card.archived) return false
              const cardPanelId = card.panelId || card.pipelineId || ''
              const cardStepId = card.stepId || card.stageId || ''
              
              if (isPanelFiltered && !filteredPanelIds.includes(cardPanelId)) {
                return false
              }
              
              return grupoStepIds.has(cardStepId)
            })
            .map((card: any) => {
              const stepInfo = stepMap.get(card.stepId || card.stageId || '')
              const panel = panels.find((p: any) => p.id === (card.panelId || card.pipelineId))
              return {
                id: card.id,
                title: card.title || '',
                value: card.monetaryAmount || 0,
                stageId: card.stepId || card.stageId || '',
                pipelineId: card.panelId || card.pipelineId || '',
                createdAt: card.createdAt,
                updatedAt: card.updatedAt,
                owner: card.responsibleUserId || '',
                contactIds: card.contactIds || [],
                panelTitle: panel?.title || 'Painel não encontrado',
                panelKey: panel?.key || '',
                stepTitle: stepInfo?.title || 'Etapa não encontrada',
                enteredGroupDate: stepInfo && grupoStepIds.has(card.stepId || card.stageId || '') ? card.updatedAt : null,
              }
            })
          break
        }

        case 'meetParticipants': {
          let filteredCards = cards
          
          if (isPanelFiltered) {
            filteredCards = cards.filter((card: any) => {
              const cardPanelId = card.panelId || ''
              return filteredPanelIds.includes(cardPanelId)
            })
          }
          
          cardsToDisplay = filteredCards
            .filter((card: any) => {
              const stepInfo = stepMap.get(card.stepId || '')
              const stepTitle = (stepInfo?.title || '').toLowerCase()
              return stepTitle.includes('meet') || stepTitle.includes('participou') || stepTitle.includes('participante')
            })
            .map((card: any) => {
              const stepInfo = stepMap.get(card.stepId || '')
              return {
                id: card.id,
                title: card.title || '',
                value: card.monetaryAmount || 0,
                stageId: card.stepId || '',
                pipelineId: card.panelId || '',
                createdAt: card.createdAt,
                updatedAt: card.updatedAt,
                owner: card.responsibleUserId || '',
                contactIds: card.contactIds || [],
                panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
                panelKey: stepInfo?.panelKey || '',
                stepTitle: stepInfo?.title || 'Etapa não encontrada',
              }
            })
          break
        }

        case 'closedSales':
        case 'revenue': {
          let filteredDeals = deals
          
          if (isPanelFiltered) {
            filteredDeals = deals.filter((deal: any) => {
              const dealPanelId = deal.pipelineId || ''
              return filteredPanelIds.includes(dealPanelId)
            })
          }
          
          cardsToDisplay = filteredDeals.map((deal: any) => {
            const stepInfo = stepMap.get(deal.stageId || '')
            return {
              id: deal.id,
              title: deal.title || '',
              value: deal.value || 0,
              stageId: deal.stageId || '',
              pipelineId: deal.pipelineId || '',
              createdAt: deal.createdAt,
              updatedAt: deal.updatedAt,
              closedAt: deal.closedAt,
              owner: deal.owner,
              contactIds: deal.contactIds || [],
              panelTitle: stepInfo?.panelTitle || 'Painel não encontrado',
              panelKey: stepInfo?.panelKey || '',
              stepTitle: stepInfo?.title || 'Etapa não encontrada',
            }
          })
          break
        }
      }

      setCardDetailsData(cardsToDisplay)
      setChartContacts(contacts.map((c) => ({
        id: c.id,
        name: c.name || '',
        email: c.email,
        phoneNumber: c.phoneNumber || c.phone || '',
        phoneNumberFormatted: c.phoneNumberFormatted || c.phoneNumber || c.phone || '',
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
        companyId: c.companyId || '',
        status: c.status || 'active',
        tags: c.tags || [],
        customFields: c.customFields || {},
      })))
    } catch (error) {
      console.error('Erro ao processar detalhes dos cards:', error)
      toast.error('Erro ao processar detalhes dos cards')
      setCardDetailsData([])
    } finally {
      setIsLoadingCardDetails(false)
    }
  }

  const handleChartDataPointClick = useCallback(
    async (chartTitle: string, period: { type: 'week' | 'days' | 'date'; value: string | number; label: string }) => {
      if (!dashboardData) return

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

        if (isLeadsCreated && dashboardData.leads && dashboardData.contacts && dashboardData.users) {
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
              return weekIndex === (12 - requestedWeek) && weekIndex >= 0 && weekIndex < 12
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
              return weekIndex === (12 - requestedWeek) && weekIndex >= 0 && weekIndex < 12
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
                onRowClick={handleLeadQualityClick}
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
  }, [dashboardData, chartOrder, chartLayout, getDynamicSpan, handleChartDataPointClick, handleLeadQualityClick])

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
                onPanelsClick={() => setShowPanelsModal(true)}
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
                {loadingPanel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-600/80 rounded-lg z-10">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                <select
                  value={(() => {
                    const panelIds = dashboardData?.filters?.panelIds
                    if (panelIds?.length === 1) {
                      return panelIds[0]
                    }
                    return 'all'
                  })()}
                  onChange={(e) => {
                    handlePanelChange(e.target.value)
                  }}
                  disabled={loadingPanel}
                  aria-label="Selecionar painel"
                  className="w-44 min-w-0 pl-1.5 sm:pl-2 md:pl-2 pr-5 sm:pr-6 md:pr-6 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 whitespace-nowrap border-0 cursor-pointer appearance-none truncate disabled:opacity-75 disabled:cursor-not-allowed"
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
          <PanelsManagerModal
            open={showPanelsModal}
            onClose={() => setShowPanelsModal(false)}
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
                if (context && dashboardData) {
                  const mergedFilters: DashboardData['filters'] = {
                    date: context.filters.date || dashboardData.filters.date || '2025-12-17',
                    sdr: context.filters.sdr || dashboardData.filters.sdr || 'Todos',
                    college: context.filters.college || dashboardData.filters.college || 'Todas',
                    origin: context.filters.origin || dashboardData.filters.origin || '',
                    dateTo: context.filters.dateTo || dashboardData.filters.dateTo,
                    panelIds: context.filters.panelIds || dashboardData.filters.panelIds,
                  }
                  loadDashboardData(mergedFilters, true)
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
          {cardDetailsType && dashboardData && (
            <CardDetailsModal
              isOpen={showCardDetailsModal}
              onClose={() => {
                setShowCardDetailsModal(false)
                setCardDetailsType(null)
                setCardDetailsData([])
                setIsLoadingCardDetails(false)
              }}
              title={(() => {
                switch (cardDetailsType) {
                  case 'leadsCreated':
                    return 'Leads Criados'
                  case 'leadsInGroup':
                    return 'Leads no Grupo'
                  case 'meetParticipants':
                    return 'Participantes no Meet'
                  case 'closedSales':
                    return 'Vendas Fechadas'
                  default:
                    return 'Receita Gerada'
                }
              })()}
              cardType={cardDetailsType}
              filters={dashboardData.filters}
              cards={cardDetailsData}
              contacts={chartContacts}
              users={dashboardData.users || []}
              isLoading={isLoadingCardDetails}
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
            {dashboardData?.filters && showFiltersInfo && (
              <div className="mb-3 sm:mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 relative">
                <button
                  onClick={() => {
                    setShowFiltersInfo(false)
                    dashboardPreferencesService.setRandomFilterNotificationEnabled(false)
                  }}
                  className="absolute top-2 right-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                  aria-label="Fechar informações de filtros"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex items-center gap-2 pr-6">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 break-words">
                    <span className="font-semibold text-blue-900 dark:text-blue-100">Filtros Aplicados:</span> {filtersDisplay}
                  </p>
                </div>
              </div>
            )}
            <div
  className="flex flex-row gap-2 items-stretch overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 sm:grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 sm:overflow-visible min-w-0"
  style={{ WebkitOverflowScrolling: 'touch' }}
>

              <button
                onClick={() => handleCardClick('leadsCreated')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-2"
                aria-label="Ver detalhes dos Leads Criados"
              >
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Leads Criados</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.leadsCreated)}</p>
              </button>
              <button
                onClick={() => handleCardClick('leadsInGroup')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-2"
                aria-label="Ver detalhes dos Leads no Grupo"
              >
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Leads no Grupo</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.leadsInGroup)}</p>
              </button>
              <button
                onClick={() => handleCardClick('meetParticipants')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-2"
                aria-label="Ver detalhes dos Participantes no Meet"
              >
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Participantes no Meet</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.generationActivation.meetParticipants)}</p>
              </button>
              <button
                onClick={() => handleCardClick('closedSales')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-2"
                aria-label="Ver detalhes das Vendas Fechadas"
              >
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Vendas Fechadas</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatNumber(dashboardData.salesConversion.closedSales)}</p>
              </button>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0">
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Taxa de Fechamento</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{dashboardData.salesConversion.closingRate.toFixed(0)}%</p>
              </div>
              <button
                onClick={() => handleCardClick('revenue')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 sm:p-2 md:p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-w-[110px] max-w-[135px] sm:min-w-0 sm:max-w-none flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-2"
                aria-label="Ver detalhes da Receita Gerada"
              >
                <h3 className="text-[9px] sm:text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400 font-secondary mb-0.5 sm:mb-1 truncate">Receita Gerada</h3>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white font-primary break-words leading-tight">{formatCurrency(dashboardData.salesConversion.revenueGenerated)}</p>
              </button>
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

