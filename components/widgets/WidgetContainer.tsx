'use client'

import { useState, useRef, useEffect } from 'react'
import ResizableWidget from './ResizableWidget'
import ChartTypeSelector, { type ChartType } from '@/components/charts/ChartTypeSelector'
import AnalysisModal from '@/components/charts/components/AnalysisModal'
import type { DataAnalysisResult } from '@/services/analytics/data-analysis-service'
import { useWidgetHeight } from '@/contexts/WidgetHeightContext'

interface WidgetContainerProps {
  readonly id: string
  readonly title: string
  readonly children: React.ReactNode
  readonly chartType?: ChartType
  readonly onChartTypeChange?: (type: ChartType) => void
  readonly availableChartTypes?: ChartType[]
  readonly onMinimize?: () => void
  readonly onRestore?: () => void
  readonly onClose?: () => void
  readonly isMinimized?: boolean
  readonly className?: string
  readonly analysisEnabled?: boolean
  readonly analysis?: DataAnalysisResult
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly headerAction?: React.ReactNode
}

export default function WidgetContainer({
  id,
  title,
  children,
  chartType,
  onChartTypeChange,
  availableChartTypes,
  onMinimize,
  onRestore,
  onClose,
  isMinimized = false,
  className = '',
  analysisEnabled = false,
  analysis,
  dragHandleProps,
  headerAction,
}: Readonly<WidgetContainerProps>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wasMinimizedRef = useRef(isMinimized)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const { widgetHeightPx, widgetHeight } = useWidgetHeight()
  const [currentHeight, setCurrentHeight] = useState(widgetHeightPx)

  useEffect(() => {
    setCurrentHeight(widgetHeightPx)
  }, [widgetHeightPx])

  const getContentHeight = () => {
    switch (widgetHeight) {
      case 'normal':
        return '85%'
      case 'large':
        return '88%'
      case 'extraLarge':
        return '91%'
      default:
        return '85%'
    }
  }

  // Cria análise padrão se não fornecida
  const defaultAnalysis: DataAnalysisResult = {
    anomalies: [],
    insights: [],
    statistics: {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      trend: 'stable',
    },
  }

  const chartAnalysis = analysis || defaultAnalysis

  // Sincroniza altura quando o gráfico é restaurado
  useEffect(() => {
    const wasMinimized = wasMinimizedRef.current
    const isNowExpanded = !isMinimized && wasMinimized

    if (!isNowExpanded || !containerRef.current) {
      wasMinimizedRef.current = isMinimized
      return
    }

    const syncHeight = () => {
      const gridParent = containerRef.current?.closest('.grid')
      if (!gridParent) return

      const currentParent = containerRef.current?.parentElement

      // Encontra todos os widgets na mesma linha (irmãos no grid)
      const siblings = Array.from(gridParent.children).filter((child) => {
        const childElement = child as HTMLElement
        const isMinimizedSibling = childElement.querySelector('button[aria-label*="Restaurar"]')
        return childElement !== currentParent && !isMinimizedSibling
      }) as HTMLElement[]

      if (siblings.length === 0) return

      // Calcula a altura dos irmãos (pega o container do ResizableWidget)
      const siblingHeights = siblings
        .map((sibling) => {
          const widgetContainer = sibling.querySelector('.relative') as HTMLElement
          return widgetContainer ? widgetContainer.offsetHeight : 0
        })
        .filter((h) => h > 0)

      if (siblingHeights.length === 0) return

      // Usa a altura máxima para manter consistência
      const targetHeight = Math.max(...siblingHeights)

      // Ajusta a altura do container restaurado
      const widgetContainer = containerRef.current?.querySelector('.relative') as HTMLElement
      if (widgetContainer && Math.abs(widgetContainer.offsetHeight - targetHeight) > 10) {
        widgetContainer.style.height = `${targetHeight}px`
        widgetContainer.style.minHeight = `${targetHeight}px`
      }
    }

    // Aguarda o próximo frame para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
      setTimeout(syncHeight, 150)
    })

    wasMinimizedRef.current = isMinimized
  }, [isMinimized])

  if (isMinimized) {
    return (
      <div className="flex items-start justify-start">
        <button
          onClick={onRestore}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onRestore?.()
            }
          }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-[#FF9D02] hover:bg-gray-50 transition-all duration-200 p-2 sm:p-2.5 flex items-center justify-between gap-2 h-auto w-auto min-w-[120px] max-w-[200px]"
          aria-label={`Restaurar ${title}`}
          title={`Clique para restaurar ${title}`}
        >
          <span className="text-xs sm:text-base font-normal text-gray-700 font-secondary truncate flex-1 min-w-0 text-left">{title}</span>
          <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col" data-widget-id={id}>
      <ResizableWidget
        className={`bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-[#FF9D02] p-1 sm:p-1.5 md:p-2 flex flex-col ${className}`}
        minHeight={currentHeight}
        fixedHeight={currentHeight}
        autoAdjustHeight={false}
      >
        <div className="mb-0.5 sm:mb-1 md:mb-1.5 flex flex-row items-center justify-between gap-1 sm:gap-1.5 border-b border-gray-200 pb-0.5 sm:pb-1 md:pb-1.5">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Arrastar para reorganizar"
                title="Arrastar para reorganizar"
              >
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8h16M4 16h16"
                  />
                </svg>
              </div>
            )}
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold font-primary text-gray-900 truncate flex-1 min-w-0">{title}</h3>
            {headerAction && (
              <div className="ml-1 sm:ml-2 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-shrink-0 flex-nowrap">
            {analysis && (
              <button
                onClick={() => setIsAnalysisModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsAnalysisModalOpen(true)
                  }
                }}
                className="px-2 sm:px-2.5 md:px-2.5 py-1 sm:py-1.5 md:py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-1.5 text-[10px] sm:text-xs md:text-xs lg:text-sm font-semibold font-secondary focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-1 whitespace-nowrap flex-shrink-0"
                style={{
                  backgroundColor: '#FF9D02',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFB84C'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF9D02'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                aria-label="Ver análises do gráfico"
                title="Ver análises"
              >
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="truncate">Análises</span>
              </button>
            )}
            {chartType && onChartTypeChange && (
              <div className="flex-shrink-0">
                <ChartTypeSelector
                  currentType={chartType}
                  onTypeChange={onChartTypeChange}
                  availableTypes={availableChartTypes}
                />
              </div>
            )}
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-0.5 sm:p-0.5 md:p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 flex items-center justify-center"
                aria-label="Minimizar widget"
                title="Minimizar"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 12H4"
                  />
                </svg>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-0.5 sm:p-0.5 md:p-1 hover:bg-red-100 rounded text-red-600 transition-colors flex-shrink-0 flex items-center justify-center"
                aria-label="Fechar widget"
                title="Fechar"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="widget-content flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ height: getContentHeight(), maxHeight: getContentHeight(), paddingBottom: '12px' }}>{children}</div>
      </ResizableWidget>

      {analysis && (
        <AnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          title={title}
          analysis={chartAnalysis}
        />
      )}
    </div>
  )
}

