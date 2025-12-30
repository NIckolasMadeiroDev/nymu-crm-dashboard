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
    // Calcular estatísticas para tooltips
    const totalLeads = data.leadsCreatedByWeek.reduce((sum, w) => sum + w.value, 0)
    const averageLeads = totalLeads / data.leadsCreatedByWeek.length
    
    // Formatar labels de forma mais compacta mas legível
    const formattedData = data.leadsCreatedByWeek.map((w, index) => {
      // No eixo X, mostrar apenas "Sem X" (sem datas)
      const displayLabel = `Sem ${w.week}`
      
      // Calcular variação em relação à média
      const variation = averageLeads > 0 ? ((w.value - averageLeads) / averageLeads * 100).toFixed(1) : '0'
      const isAboveAverage = w.value > averageLeads
      
      return {
        name: displayLabel, // Label resumido para eixo X
        value: w.value,
        week: w.week,
        fullLabel: w.label, // Label completo para tooltip
        // Informações extras para tooltip detalhado
        weekNumber: w.week,
        totalLeads: w.value,
        variation: variation,
        isAboveAverage: isAboveAverage,
        position: index + 1,
        totalWeeks: data.leadsCreatedByWeek.length,
      }
    })
    
    return {
      type: 'area',
      title: 'Geração e Ativação',
      data: formattedData,
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 200, // Aumentar altura para melhor visualização
      xAxisLabel: 'Semana',
      yAxisLabel: 'Leads Criados',
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
          // Encontrar a semana correspondente pelo label ou usar fullLabel se disponível
          const labelToFind = clickData.fullLabel || clickData.name
          const weekData = data.leadsCreatedByWeek.find((w) => w.label === labelToFind || w.label.includes(clickData.name))
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

