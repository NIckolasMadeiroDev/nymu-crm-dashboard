'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ChartMinimizationContextType {
  minimizedCharts: Set<string>
  toggleMinimize: (chartId: string) => void
  isMinimized: (chartId: string) => boolean
  getVisibleCount: (chartIds: string[]) => number
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

  return (
    <ChartMinimizationContext.Provider value={{ minimizedCharts, toggleMinimize, isMinimized, getVisibleCount }}>
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

