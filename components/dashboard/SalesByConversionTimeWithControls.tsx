'use client'

import { useMemo, useState, useCallback } from 'react'
import ChartWithControls from './ChartWithControls'
import type { SalesByConversionTime, TimeSeriesData } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'
import type { ChartType } from '@/components/charts/ChartTypeSelector'

interface SalesByConversionTimeWithControlsProps {
  readonly data: SalesByConversionTime
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (days: number, seriesKey: string, seriesName: string) => void
}

export default function SalesByConversionTimeWithControls({
  data,
  dragHandleProps,
  onDataPointClick,
}: SalesByConversionTimeWithControlsProps) {
  const [currentChartType, setCurrentChartType] = useState<'line' | 'area' | 'stackedArea' | 'scatter' | 'bubble'>('area')

  const chartConfig: ChartConfig = useMemo(() => {
    const series: Array<{ key: string; name: string; color: string }> = []

    const seriesConfig = [
      { key: 'sevenDays', name: '7 Dias', color: '#3b82f6', data: data.sevenDays || [] },
      { key: 'thirtyDays', name: '30 Dias', color: '#10b981', data: data.thirtyDays || [] },
      { key: 'ninetyDays', name: '90 Dias', color: '#ef4444', data: data.ninetyDays || [] },
      { key: 'oneEightyDays', name: '180 Dias', color: '#f59e0b', data: data.oneEightyDays || [] },
    ]

    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        series.push({
          key: seriesItem.key,
          name: seriesItem.name,
          color: seriesItem.color,
        })
      }
    })

    if (currentChartType === 'scatter' || currentChartType === 'bubble') {
      const scatterData: Array<{ x: number; y: number; z?: number; category: string }> = []

      seriesConfig.forEach((seriesItem) => {
        if (seriesItem.data && seriesItem.data.length > 0) {
          seriesItem.data.forEach((point: TimeSeriesData) => {
            if (point && typeof point.days === 'number' && typeof point.value === 'number' && point.value > 0) {
              scatterData.push({
                x: point.days,
                y: point.value,
                z: currentChartType === 'bubble' ? Math.max(10, Math.min(400, point.value / 2)) : undefined,
                category: seriesItem.key,
              })
            }
          })
        }
      })

      return {
        type: currentChartType,
        title: 'Vendas por Tempo de Conversão',
        data: scatterData,
        series,
        xAxisKey: 'x',
        yAxisKey: 'y',
        height: 160,
        xAxisLabel: 'Dias',
        yAxisLabel: 'Vendas',
      }
    }

    const allDates = new Set<string>()
    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        seriesItem.data.forEach((point: TimeSeriesData) => {
          if (point && typeof point.days === 'number') {
            // Formatar de forma mais legível
            const days = point.days
            let label = ''
            if (days === 1) {
              label = '1 dia'
            } else if (days < 30) {
              label = `${days} dias`
            } else if (days === 30) {
              label = '30 dias'
            } else if (days < 90) {
              label = `${days} dias`
            } else if (days === 90) {
              label = '90 dias'
            } else {
              label = `${days} dias`
            }
            allDates.add(`${days}d|${label}`)
          }
        })
      }
    })

    const findPointValue = (seriesItem: typeof seriesConfig[0], daysKey: string): number => {
      if (!seriesItem.data || seriesItem.data.length === 0) {
        return 0
      }
      const days = Number.parseInt(daysKey.replace('d', ''), 10)
      const point = seriesItem.data.find(
        (p: TimeSeriesData) => p && p.days === days
      )
      return point && typeof point.value === 'number' ? point.value : 0
    }

    const transformedData = Array.from(allDates).map((dateStr) => {
      const [daysKey, label] = dateStr.split('|')
      const days = Number.parseInt(daysKey.replace('d', ''), 10) || 0
      
      // Calcular total de todas as séries para este ponto
      let totalValue = 0
      seriesConfig.forEach((seriesItem) => {
        totalValue += findPointValue(seriesItem, daysKey)
      })
      
      // Calcular informações adicionais para tooltip
      const activeSeries = seriesConfig.filter(s => findPointValue(s, daysKey) > 0)
      const maxSeries = seriesConfig.reduce((max, s) => {
        const val = findPointValue(s, daysKey)
        return val > max.value ? { key: s.key, name: s.name, value: val } : max
      }, { key: '', name: '', value: 0 })
      
      const dateObj: Record<string, string | number> = { 
        date: daysKey, // Manter para ordenação
        dateLabel: label || daysKey, // Label formatado para exibição (resumido)
        days: days, // Dias numéricos para tooltip
        totalValue: totalValue, // Total para tooltip
        activeSeriesCount: activeSeries.length, // Quantas séries têm valor
        maxSeriesName: maxSeries.name, // Série com maior valor
        maxSeriesValue: maxSeries.value, // Valor da série maior
      }

      seriesConfig.forEach((seriesItem) => {
        dateObj[seriesItem.key] = findPointValue(seriesItem, daysKey)
      })

      return dateObj
    })

    transformedData.sort((a, b) => {
      const aDays = Number.parseInt((a.date as string).replace('d', ''), 10) || 0
      const bDays = Number.parseInt((b.date as string).replace('d', ''), 10) || 0
      return aDays - bDays
    })

    const allValues: number[] = []
    seriesConfig.forEach((seriesItem) => {
      if (seriesItem.data && seriesItem.data.length > 0) {
        seriesItem.data.forEach((point: TimeSeriesData) => {
          if (point && typeof point.value === 'number') {
            allValues.push(Math.abs(point.value))
          }
        })
      }
    })
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
    const useAdaptive = maxValue >= 1000

    return {
      type: currentChartType === 'line' ? 'line' : 'area',
      title: 'Vendas por Tempo de Conversão',
      data: transformedData,
      series,
      xAxisKey: 'dateLabel', // Usar label formatado para exibição
      yAxisKey: 'value',
      height: 200, // Aumentar altura para melhor visualização
      useAdaptive,
      xAxisLabel: 'Tempo de Conversão',
      yAxisLabel: 'Quantidade de Vendas',
    }
  }, [data, currentChartType])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    if (type === 'scatter' || type === 'bubble' || type === 'line' || type === 'area' || type === 'stackedArea') {
      setCurrentChartType(type)
    }
  }, [])

  // Função auxiliar para extrair dias de uma string
  const extractDays = (dateStr: string): number | null => {
    // Pode vir como "7d" ou "7d|7 dias" ou "dateLabel"
    const regex = /(\d+)d/
    const match = regex.exec(dateStr)
    return match ? Number.parseInt(match[1], 10) : null
  }

  // Função auxiliar para obter nome da série
  const getSeriesName = (key: string): string => {
    const seriesNames: Record<string, string> = {
      sevenDays: '7 Dias',
      thirtyDays: '30 Dias',
      ninetyDays: '90 Dias',
      oneEightyDays: '180 Dias',
    }
    return seriesNames[key] || key
  }

  // Função auxiliar para identificar série ativa
  const identifyActiveSeries = (clickData: any): { key: string; name: string } => {
    if (clickData.sevenDays && clickData.sevenDays > 0) {
      return { key: 'sevenDays', name: '7 Dias' }
    }
    if (clickData.thirtyDays && clickData.thirtyDays > 0) {
      return { key: 'thirtyDays', name: '30 Dias' }
    }
    if (clickData.ninetyDays && clickData.ninetyDays > 0) {
      return { key: 'ninetyDays', name: '90 Dias' }
    }
    if (clickData.oneEightyDays && clickData.oneEightyDays > 0) {
      return { key: 'oneEightyDays', name: '180 Dias' }
    }
    if (clickData.seriesKey) {
      return { key: clickData.seriesKey, name: clickData.seriesName || getSeriesName(clickData.seriesKey) }
    }
    return { key: 'sevenDays', name: '7 Dias' }
  }

  const handleDataPointClick = (clickData: any) => {
    console.log('[SalesByConversionTimeWithControls] handleDataPointClick called with:', clickData)
    if (!onDataPointClick || !clickData) return

    // Para gráficos de tempo de conversão, o clickData pode ter diferentes formatos
    if (clickData.date || clickData.dateLabel) {
      const dateStr = (clickData.dateLabel || clickData.date) as string
      const days = extractDays(dateStr)
      if (days !== null) {
        if (clickData.seriesKey) {
          // Formato alternativo com seriesKey explícito
          const seriesName = clickData.seriesName || getSeriesName(clickData.seriesKey)
          console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick (alt format) with:', days, clickData.seriesKey, seriesName)
          onDataPointClick(days, clickData.seriesKey, seriesName)
        } else {
          const series = identifyActiveSeries(clickData)
          console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick with:', days, series.key, series.name)
          onDataPointClick(days, series.key, series.name)
        }
      }
    } else if (typeof clickData.x === 'number') {
      // Formato scatter/bubble
      const days = clickData.x
      const seriesKey = clickData.category || 'sevenDays'
      const seriesName = getSeriesName(seriesKey)
      console.log('[SalesByConversionTimeWithControls] Calling onDataPointClick (scatter) with:', days, seriesKey, seriesName)
      onDataPointClick(days, seriesKey, seriesName)
    } else {
      console.warn('[SalesByConversionTimeWithControls] clickData format not recognized:', clickData)
    }
  }

  return (
    <ChartWithControls
      id="sales-conversion-time-chart"
      title="Vendas por Tempo de Conversão"
      initialChartType="area"
      chartConfig={chartConfig}
      availableChartTypes={['line', 'area', 'stackedArea', 'scatter', 'bubble']}
      onChartTypeChange={handleChartTypeChange}
      dragHandleProps={dragHandleProps}
      onDataPointClick={handleDataPointClick}
    />
  )
}

