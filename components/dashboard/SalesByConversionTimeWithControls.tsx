'use client'

import { useMemo, useState, useCallback } from 'react'
import ChartWithControls from './ChartWithControls'
import type { SalesByConversionTime, TimeSeriesData } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'
import type { ChartType } from '@/components/charts/ChartTypeSelector'

interface SalesByConversionTimeWithControlsProps {
  readonly data: SalesByConversionTime
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (days: number, seriesKey: string, seriesName: string) => void
}

export default function SalesByConversionTimeWithControls({
  data,
  dragHandleProps,
  onDataPointClick,
}: SalesByConversionTimeWithControlsProps) {
  const [currentChartType, setCurrentChartType] = useState<'line' | 'area' | 'stackedArea' | 'scatter' | 'bubble'>('area')

  const chartConfig: ChartConfig = useMemo(() => {
    const series: Array<{ key: string; name: string; color: string }> = []

    const seriesConfig = [
      { key: 'sevenDays', name: '7 Dias', color: '#3b82f6', data: data.sevenDays || [] },
      { key: 'thirtyDays', name: '30 Dias', color: '#10b981', data: data.thirtyDays || [] },
      { key: 'ninetyDays', name: '90 Dias', color: '#ef4444', data: data.ninetyDays || [] },
      { key: 'oneEightyDays', name: '180 Dias', color: '#f59e0b', data: data.oneEightyDays || [] },
    ]

    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        series.push({
          key: seriesItem.key,
          name: seriesItem.name,
          color: seriesItem.color,
        })
      }
    })

    if (currentChartType === 'scatter' || currentChartType === 'bubble') {
      const scatterData: Array<{ x: number; y: number; z?: number; category: string }> = []

      seriesConfig.forEach((seriesItem) => {
        if (seriesItem.data && seriesItem.data.length > 0) {
          seriesItem.data.forEach((point: TimeSeriesData) => {
            if (point && typeof point.days === 'number' && typeof point.value === 'number' && point.value > 0) {
              scatterData.push({
                x: point.days,
                y: point.value,
                z: currentChartType === 'bubble' ? Math.max(10, Math.min(400, point.value / 2)) : undefined,
                category: seriesItem.key,
              })
            }
          })
        }
      })

      return {
        type: currentChartType,
        title: 'Vendas por Tempo de Conversão',
        data: scatterData,
        series,
        xAxisKey: 'x',
        yAxisKey: 'y',
        height: 160,
        xAxisLabel: 'Dias',
        yAxisLabel: 'Vendas',
      }
    }

    const allDates = new Set<string>()
    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        seriesItem.data.forEach((point: TimeSeriesData) => {
          if (point && typeof point.days === 'number') {
            allDates.add(`${point.days}d`)
          }
        })
      }
    })

    const findPointValue = (seriesItem: typeof seriesConfig[0], dateStr: string): number => {
      if (!seriesItem.data || seriesItem.data.length === 0) {
        return 0
      }
      const point = seriesItem.data.find(
        (p: TimeSeriesData) => p && `${p.days}d` === dateStr
      )
      return point && typeof point.value === 'number' ? point.value : 0
    }

    const transformedData = Array.from(allDates).map((dateStr) => {
      const dateObj: Record<string, string | number> = { date: dateStr }

      seriesConfig.forEach((seriesItem) => {
        dateObj[seriesItem.key] = findPointValue(seriesItem, dateStr)
      })

      return dateObj
    })

    transformedData.sort((a, b) => {
      const aDays = Number.parseInt((a.date as string).replace('d', ''), 10) || 0
      const bDays = Number.parseInt((b.date as string).replace('d', ''), 10) || 0
      return aDays - bDays
    })

    const allValues: number[] = []
    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        seriesItem.data.forEach((point: TimeSeriesData) => {
          if (point && typeof point.value === 'number') {
            allValues.push(Math.abs(point.value))
          }
        })
      }
    })
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
    const useAdaptive = maxValue >= 1000

    return {
      type: currentChartType === 'line' ? 'line' : 'area',
      title: 'Vendas por Tempo de Conversão',
      data: transformedData,
      series,
      xAxisKey: 'date',
      yAxisKey: 'value',
      height: 160,
      useAdaptive,
    }
  }, [data, currentChartType])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    if (type === 'scatter' || type === 'bubble' || type === 'line' || type === 'area' || type === 'stackedArea') {
      setCurrentChartType(type)
    }
  }, [])

  const handleDataPointClick = (clickData: any) => {
    console.log('[SalesByConversionTimeWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      // Para gráficos de tempo de conversão, o clickData pode ter diferentes formatos
      if (clickData.date) {
        // Extrair número de dias do formato "Xd" (ex: "21d")
        const daysMatch = (clickData.date as string).match(/(\d+)d/)
        if (daysMatch) {
          const days = Number.parseInt(daysMatch[1], 10)
          
          // Determinar qual série tem valor > 0 para identificar a série clicada
          let seriesKey = 'sevenDays'
          let seriesName = '7 Dias'
          
          if (clickData.sevenDays && clickData.sevenDays > 0) {
            seriesKey = 'sevenDays'
            seriesName = '7 Dias'
          } else if (clickData.thirtyDays && clickData.thirtyDays > 0) {
            seriesKey = 'thirtyDays'
            seriesName = '30 Dias'
          } else if (clickData.ninetyDays && clickData.ninetyDays > 0) {
            seriesKey = 'ninetyDays'
            seriesName = '90 Dias'
          } else if (clickData.oneEightyDays && clickData.oneEightyDays > 0) {
            seriesKey = 'oneEightyDays'
            seriesName = '180 Dias'
          } else if (clickData.seriesKey) {
            // Se já tem seriesKey, usar diretamente
            seriesKey = clickData.seriesKey
            seriesName = clickData.seriesName || 
                        (seriesKey === 'sevenDays' ? '7 Dias' :
                         seriesKey === 'thirtyDays' ? '30 Dias' :
                         seriesKey === 'ninetyDays' ? '90 Dias' :
                         seriesKey === 'oneEightyDays' ? '180 Dias' : seriesKey)
          }
          
          console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick with:', days, seriesKey, seriesName)
          onDataPointClick(days, seriesKey, seriesName)
        }
      } else if (clickData.seriesKey && clickData.date) {
        // Formato alternativo com seriesKey explícito
        const daysMatch = (clickData.date as string).match(/(\d+)d/)
        if (daysMatch) {
          const days = Number.parseInt(daysMatch[1], 10)
          const seriesName = clickData.seriesName || clickData.seriesKey
          console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick (alt format) with:', days, clickData.seriesKey, seriesName)
          onDataPointClick(days, clickData.seriesKey, seriesName)
        }
      } else if (clickData.x !== undefined) {
        // Formato scatter/bubble
        const days = clickData.x
        const seriesKey = clickData.category || 'sevenDays'
        const seriesName = seriesKey === 'sevenDays' ? '7 Dias' :
                          seriesKey === 'thirtyDays' ? '30 Dias' :
                          seriesKey === 'ninetyDays' ? '90 Dias' :
                          seriesKey === 'oneEightyDays' ? '180 Dias' : seriesKey
        console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick (scatter) with:', days, seriesKey, seriesName)
        onDataPointClick(days, seriesKey, seriesName)
      } else {
        console.warn('[SalesByConversionTimeWithControls] clickData format not recognized:', clickData)
      }
    } else {
      console.warn('[SalesByConversionTimeWithControls] onDataPointClick not available or clickData is null')
    }
  }

  return (
    <ChartWithControls
      id="sales-conversion-time-chart"
      title="Vendas por Tempo de Conversão"
      initialChartType="area"
      chartConfig={chartConfig}
      availableChartTypes={['line', 'area', 'stackedArea', 'scatter', 'bubble']}
      onChartTypeChange={handleChartTypeChange}
      dragHandleProps={dragHandleProps}
      onDataPointClick={handleDataPointClick}
    />
  )
}

