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
    return {
      type: 'bar',
      title: 'Conversão de Vendas',
      data: data.salesByWeek.map((w) => ({
        name: w.label,
        value: w.value,
      })),
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 160,
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

