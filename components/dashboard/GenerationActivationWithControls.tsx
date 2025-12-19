'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { GenerationActivationMetrics } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface GenerationActivationWithControlsProps {
  readonly data: GenerationActivationMetrics
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function GenerationActivationWithControls({
  data,
  dragHandleProps,
}: GenerationActivationWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    return {
      type: 'bar',
      title: 'Geração e Ativação',
      data: data.leadsCreatedByWeek.map((w) => ({
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
      id="generation-activation-chart"
      title="Leads Criados por Semana"
      initialChartType="bar"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'line', 'area', 'column', 'stackedBar', 'histogram']}
      dragHandleProps={dragHandleProps}
    />
  )
}

