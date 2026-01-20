'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { SalesConversionMetrics } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface SalesConversionWithControlsProps {
  readonly data: SalesConversionMetrics
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (week: number, label: string) => void
}

export default function SalesConversionWithControls({
  data,
  dragHandleProps,
  onDataPointClick,
}: SalesConversionWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    const sortedData = [...data.salesByWeek].reverse()
    
    const totalSales = sortedData.reduce((sum, w) => sum + w.value, 0)
    const averageSales = totalSales / sortedData.length
    
    const chartData = sortedData.map((w, index) => {
      const displayLabel = `Sem ${w.week}`
      
      const variation = averageSales > 0 ? ((w.value - averageSales) / averageSales * 100).toFixed(1) : '0'
      const isAboveAverage = w.value > averageSales
      
      return {
        name: displayLabel,
        value: w.value,
        week: w.week,
        fullLabel: w.label,
        weekNumber: w.week,
        totalSales: w.value,
        variation: variation,
        isAboveAverage: isAboveAverage,
        position: index + 1,
        totalWeeks: sortedData.length,
      }
    })

    const allValues = chartData.map((d) => Math.abs(d.value))
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
    const useAdaptive = maxValue >= 1000

    return {
      type: 'bar',
      title: 'Conversão de Vendas',
      data: chartData,
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 200, // Aumentar altura para melhor visualização
      useAdaptive,
      xAxisLabel: 'Semana',
      yAxisLabel: 'Vendas',
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    console.log('[SalesConversionWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      if (clickData.name && clickData.value !== undefined) {
        if (clickData.week !== undefined) {
          console.log('[SalesConversionWithControls] Using week from clickData:', clickData.week, clickData.name)
          onDataPointClick(clickData.week, clickData.name)
        } else {
          const labelToFind = clickData.fullLabel || clickData.name
          const sortedData = [...data.salesByWeek].reverse()
          const weekData = sortedData.find((w) => w.label === labelToFind || w.label.includes(clickData.name))
          console.log('[SalesConversionWithControls] Found weekData:', weekData)
          if (weekData) {
            console.log('[SalesConversionWithControls] Calling onDataPointClick with:', weekData.week, weekData.label)
            onDataPointClick(weekData.week, weekData.label)
          }
        }
      } else {
        console.log('[SalesConversionWithControls] clickData format not recognized:', clickData)
      }
    } else {
      console.log('[SalesConversionWithControls] onDataPointClick not available or clickData is null')
    }
  }

  return (
    <ChartWithControls
      id="sales-conversion-chart"
      title="Vendas por Semana"
      initialChartType="line"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'line', 'area', 'column', 'stackedBar', 'histogram']}
      dragHandleProps={dragHandleProps}
      onDataPointClick={handleDataPointClick}
    />
  )
}

