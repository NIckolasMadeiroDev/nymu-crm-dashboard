import { useMemo } from 'react'
import type { ChartConfig } from '@/types/charts'
import { formatXAxis, formatYAxis, formatValue, formatTooltipValue, shouldUseAdaptiveFormatting, calculateAdaptiveDomain, type FormatOptions, type AdaptiveDomain } from '../utils/chart-formatters'

export const useChartFormatters = (config: ChartConfig) => {
  const xAxisKey = config.xAxisKey || 'date'
  const yAxisKey = config.yAxisKey || 'value'
  
  // Detectar se precisa usar formatação adaptativa baseado nos dados
  const useAdaptive = useMemo(() => {
    if (config.useAdaptive !== undefined) {
      return config.useAdaptive
    }
    if (config.data && Array.isArray(config.data) && config.data.length > 0) {
      return shouldUseAdaptiveFormatting(config.data, yAxisKey)
    }
    return false
  }, [config.data, config.useAdaptive, yAxisKey])
  
  // Calcular domínio adaptativo para o eixo Y
  const adaptiveDomain = useMemo(() => {
    if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
      return null
    }
    
    const seriesKeys = config.series?.map(s => s.key) || []
    return calculateAdaptiveDomain(config.data, yAxisKey, seriesKeys)
  }, [config.data, config.series, yAxisKey])
  
  const formatOptions: FormatOptions = useMemo(() => ({
    title: config.title,
    format: config.format,
    useAdaptive: adaptiveDomain?.useAdaptive || useAdaptive,
  }), [config.title, config.format, adaptiveDomain, useAdaptive])

  const formatX = useMemo(() => {
    return (tickItem: any) => formatXAxis(tickItem, xAxisKey)
  }, [xAxisKey])

  const formatY = useMemo(() => {
    return (value: number) => formatYAxis(value, formatOptions)
  }, [formatOptions])

  const formatTooltip = useMemo(() => {
    return (value: number | undefined, name?: string | undefined) => 
      formatTooltipValue(value, name, formatOptions)
  }, [formatOptions])

  const formatValueFn = useMemo(() => {
    return (value: number | undefined) => formatValue(value, formatOptions)
  }, [formatOptions])

  return {
    formatX,
    formatY,
    formatTooltip,
    formatValue: formatValueFn,
    xAxisKey,
    yAxisKey,
    useAdaptive: adaptiveDomain?.useAdaptive || useAdaptive,
    adaptiveDomain,
  }
}

