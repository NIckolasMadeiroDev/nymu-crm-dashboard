'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { GenerationActivationMetrics } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface GenerationActivationWithControlsProps {
  readonly data: GenerationActivationMetrics
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (week: number, label: string) => void
}

export default function GenerationActivationWithControls({
  data,
  dragHandleProps,
  onDataPointClick,
}: GenerationActivationWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    const sortedData = [...data.leadsCreatedByWeek].reverse()
    
    const totalLeads = sortedData.reduce((sum, w) => sum + w.value, 0)
    const averageLeads = totalLeads / sortedData.length
    
    const formattedData = sortedData.map((w, index) => {
      const displayLabel = `Sem ${w.week}`
      
      const variation = averageLeads > 0 ? ((w.value - averageLeads) / averageLeads * 100).toFixed(1) : '0'
      const isAboveAverage = w.value > averageLeads
      
      return {
        name: displayLabel,
        value: w.value,
        week: w.week,
        fullLabel: w.label,
        weekNumber: w.week,
        totalLeads: w.value,
        variation: variation,
        isAboveAverage: isAboveAverage,
        position: index + 1,
        totalWeeks: sortedData.length,
      }
    })
    
    return {
      type: 'area',
      title: 'Geração e Ativação',
      data: formattedData,
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 200,
      xAxisLabel: 'Semana',
      yAxisLabel: 'Leads Criados',
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    console.log('[GenerationActivationWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      if (clickData.name && clickData.value !== undefined) {
        if (clickData.week !== undefined) {
          console.log('[GenerationActivationWithControls] Using week from clickData:', clickData.week, clickData.name)
          onDataPointClick(clickData.week, clickData.name)
        } else {
          const labelToFind = clickData.fullLabel || clickData.name
          const sortedData = [...data.leadsCreatedByWeek].reverse()
          const weekData = sortedData.find((w) => w.label === labelToFind || w.label.includes(clickData.name))
          console.log('[GenerationActivationWithControls] Found weekData:', weekData)
          if (weekData) {
            console.log('[GenerationActivationWithControls] Calling onDataPointClick with:', weekData.week, weekData.label)
            onDataPointClick(weekData.week, weekData.label)
          }
        }
      } else {
        console.log('[GenerationActivationWithControls] clickData format not recognized:', clickData)
      }
    } else {
      console.log('[GenerationActivationWithControls] onDataPointClick not available or clickData is null')
    }
  }

  return (
    <ChartWithControls
      id="generation-activation-chart"
      title="Leads Criados por Semana"
      initialChartType="area"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'line', 'area', 'column', 'stackedBar', 'histogram']}
      dragHandleProps={dragHandleProps}
      onDataPointClick={handleDataPointClick}
    />
  )
}

