'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { SalesConversionMetrics } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface SalesConversionWithControlsProps {
  readonly data: SalesConversionMetrics
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function SalesConversionWithControls({
  data,
  dragHandleProps,
}: SalesConversionWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    const chartData = data.salesByWeek.map((w) => ({
      name: w.label,
      value: w.value,
    }))
    
    // Detectar se precisa usar formatação adaptativa
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

  return (
    <ChartWithControls
      id="sales-conversion-chart"
      title="Vendas por Semana"
      initialChartType="line"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'line', 'area', 'column', 'stackedBar', 'histogram']}
      dragHandleProps={dragHandleProps}
    />
  )
}

