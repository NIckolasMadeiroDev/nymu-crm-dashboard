'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ChartMinimizationContextType {
  minimizedCharts: Set<string>
  toggleMinimize: (chartId: string) => void
  isMinimized: (chartId: string) => boolean
  getVisibleCount: (chartIds: string[]) => number
  getDynamicSpan: (chartId: string, chartOrder: string[], chartLayout: 'one' | 'two' | 'three') => number
}

const ChartMinimizationContext = createContext<ChartMinimizationContextType | undefined>(undefined)

export function ChartMinimizationProvider({ children }: { children: ReactNode }) {
  const [minimizedCharts, setMinimizedCharts] = useState<Set<string>>(new Set())

  const toggleMinimize = useCallback((chartId: string) => {
    setMinimizedCharts((prev) => {
      const next = new Set(prev)
      if (next.has(chartId)) {
        next.delete(chartId)
      } else {
        next.add(chartId)
      }
      return next
    })
  }, [])

  const isMinimized = useCallback(
    (chartId: string) => {
      return minimizedCharts.has(chartId)
    },
    [minimizedCharts]
  )

  const getVisibleCount = useCallback(
    (chartIds: string[]) => {
      return chartIds.filter((id) => !minimizedCharts.has(id)).length
    },
    [minimizedCharts]
  )

  const getDynamicSpan = useCallback(
    (chartId: string, chartOrder: string[], chartLayout: 'one' | 'two' | 'three') => {
      const isMinimizedChart = minimizedCharts.has(chartId)

      if (isMinimizedChart) {
        return 1
      }

      const columnsPerRow = chartLayout === 'one' ? 1 : chartLayout === 'two' ? 2 : 3
      const chartIndex = chartOrder.indexOf(chartId)

      if (chartIndex === -1) {
        return 1
      }

      const rowStart = Math.floor(chartIndex / columnsPerRow) * columnsPerRow
      const rowEnd = rowStart + columnsPerRow
      const rowCharts = chartOrder.slice(rowStart, rowEnd)

      const minimizedInRow = rowCharts.filter((id) => minimizedCharts.has(id)).length
      const visibleInRow = rowCharts.length - minimizedInRow

      if (visibleInRow === 0 || minimizedInRow === 0) {
        return 1
      }

      const columnsForMinimized = minimizedInRow
      const totalAvailableColumns = columnsPerRow
      const columnsForVisible = totalAvailableColumns - columnsForMinimized

      if (columnsForVisible <= 0) {
        return 1
      }

      const spanPerVisible = Math.floor(columnsForVisible / visibleInRow)
      const remainder = columnsForVisible % visibleInRow

      const visibleChartsInRow = rowCharts.filter((id) => !minimizedCharts.has(id))
      const chartPositionInRow = visibleChartsInRow.indexOf(chartId)

      let dynamicSpan = spanPerVisible
      if (remainder > 0 && chartPositionInRow < remainder) {
        dynamicSpan += 1
      }

      return Math.max(1, Math.min(dynamicSpan, columnsPerRow))
    },
    [minimizedCharts]
  )

  return (
    <ChartMinimizationContext.Provider value={{ minimizedCharts, toggleMinimize, isMinimized, getVisibleCount, getDynamicSpan }}>
      {children}
    </ChartMinimizationContext.Provider>
  )
}

export function useChartMinimization() {
  const context = useContext(ChartMinimizationContext)
  if (!context) {
    throw new Error('useChartMinimization must be used within ChartMinimizationProvider')
  }
  return context
}

