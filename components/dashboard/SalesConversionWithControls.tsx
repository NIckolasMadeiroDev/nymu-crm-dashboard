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
    // Calcular estatísticas para tooltips
    const totalSales = data.salesByWeek.reduce((sum, w) => sum + w.value, 0)
    const averageSales = totalSales / data.salesByWeek.length
    
    const chartData = data.salesByWeek.map((w, index) => {
      // No eixo X, mostrar apenas "Sem X" (sem datas)
      const displayLabel = `Sem ${w.week}`
      
      // Calcular variação em relação à média
      const variation = averageSales > 0 ? ((w.value - averageSales) / averageSales * 100).toFixed(1) : '0'
      const isAboveAverage = w.value > averageSales
      
      return {
        name: displayLabel, // Label resumido para eixo X
        value: w.value,
        week: w.week,
        fullLabel: w.label, // Label completo para tooltip
        // Informações extras para tooltip detalhado
        weekNumber: w.week,
        totalSales: w.value,
        variation: variation,
        isAboveAverage: isAboveAverage,
        position: index + 1,
        totalWeeks: data.salesByWeek.length,
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
      // Adaptar o formato dos dados do ChartFactory para o formato esperado
      // O Recharts passa o payload diretamente
      if (clickData.name && clickData.value !== undefined) {
        // Se já tem week no clickData, usar diretamente
        if (clickData.week !== undefined) {
          console.log('[SalesConversionWithControls] Using week from clickData:', clickData.week, clickData.name)
          onDataPointClick(clickData.week, clickData.name)
        } else {
          // Encontrar a semana correspondente pelo label ou usar fullLabel se disponível
          const labelToFind = clickData.fullLabel || clickData.name
          const weekData = data.salesByWeek.find((w) => w.label === labelToFind || w.label.includes(clickData.name))
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

