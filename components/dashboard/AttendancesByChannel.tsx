'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { ChannelMetrics } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface AttendancesByChannelProps {
  readonly data: ChannelMetrics[]
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (channel: string, label: string) => void
}

export default function AttendancesByChannel({
  data,
  dragHandleProps,
  onDataPointClick,
}: AttendancesByChannelProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    const chartData = data.map((item) => ({
      name: item.channel || 'Sem canal',
      value: item.count,
      category: item.channel || 'sem-canal',
      categoryLabel: item.channel || 'Sem canal',
    }))

    return {
      type: 'bar',
      title: 'Atendimentos por Canal',
      data: chartData,
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 200,
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    if (onDataPointClick && clickData) {
      const channel = clickData.category || clickData.name || 'sem-canal'
      const label = clickData.categoryLabel || clickData.name || 'Sem canal'
      onDataPointClick(channel, label)
    }
  }

  return (
    <ChartWithControls
      id="attendances-by-channel-chart"
      title="Atendimentos por Canal"
      initialChartType="bar"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'column', 'pie', 'donut']}
      dragHandleProps={dragHandleProps}
      onDataPointClick={onDataPointClick ? handleDataPointClick : undefined}
    />
  )
}

