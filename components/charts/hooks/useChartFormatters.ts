import { useMemo } from 'react'
import type { ChartConfig } from '@/types/charts'
import { formatXAxis, formatYAxis, formatValue, formatTooltipValue, type FormatOptions } from '../utils/chart-formatters'

export const useChartFormatters = (config: ChartConfig) => {
  const xAxisKey = config.xAxisKey || 'date'
  const yAxisKey = config.yAxisKey || 'value'
  
  const formatOptions: FormatOptions = useMemo(() => ({
    title: config.title,
    format: config.format,
  }), [config.title, config.format])

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
  }
}

