import { formatCurrency, formatNumber } from '@/utils/format-currency'

export interface FormatOptions {
  title?: string
  format?: 'number' | 'currency' | 'percentage'
}

export const formatXAxis = (tickItem: any, xAxisKey: string): string => {
  if (xAxisKey === 'date') {
    const date = new Date(tickItem)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    }
    return tickItem
  }
  return String(tickItem)
}

export const formatYAxis = (value: number, options: FormatOptions = {}): string => {
  const { title, format } = options
  
  if (format === 'currency' || title?.toLowerCase().includes('receita') || title?.toLowerCase().includes('valor')) {
    return formatCurrency(value)
  }
  
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  
  return formatNumber(value)
}

export const formatValue = (value: number | undefined, options: FormatOptions = {}): string => {
  return formatYAxis(value ?? 0, options)
}

export const formatTooltipValue = (
  value: number | undefined,
  name: string | undefined,
  options: FormatOptions = {}
): [string, string] => {
  return [formatValue(value, options), name || '']
}

