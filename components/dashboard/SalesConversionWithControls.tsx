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
    const chartData = data.salesByWeek.map((w) => ({
      name: w.label,
      value: w.value,
      week: w.week, // Adicionar week para facilitar o lookup
    }))

    const allValues = chartData.map((d) => Math.abs(d.value))
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
    const useAdaptive = maxValue >= 1000

    return {
      type: 'bar',
      title: 'Conversão de Vendas',
      data: chartData,
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 160,
      useAdaptive,
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    console.log('[SalesConversionWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      // Adaptar o formato dos dados do ChartFactory para o formato esperado
      // O Recharts passa o payload diretamente
      if (clickData.name && clickData.value !== undefined) {
        // Se já tem week no clickData, usar diretamente
        if (clickData.week !== undefined) {
          console.log('[SalesConversionWithControls] Using week from clickData:', clickData.week, clickData.name)
          onDataPointClick(clickData.week, clickData.name)
        } else {
          // Encontrar a semana correspondente pelo label
          const weekData = data.salesByWeek.find((w) => w.label === clickData.name)
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

