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
    return {
      type: 'area',
      title: 'Geração e Ativação',
      data: data.leadsCreatedByWeek.map((w) => ({
        name: w.label,
        value: w.value,
        week: w.week, // Adicionar week para facilitar o lookup
      })),
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 160,
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    console.log('[GenerationActivationWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      // Adaptar o formato dos dados do ChartFactory para o formato esperado
      if (clickData.name && clickData.value !== undefined) {
        // Se já tem week no clickData, usar diretamente
        if (clickData.week !== undefined) {
          console.log('[GenerationActivationWithControls] Using week from clickData:', clickData.week, clickData.name)
          onDataPointClick(clickData.week, clickData.name)
        } else {
          // Encontrar a semana correspondente pelo label
          const weekData = data.leadsCreatedByWeek.find((w) => w.label === clickData.name)
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

