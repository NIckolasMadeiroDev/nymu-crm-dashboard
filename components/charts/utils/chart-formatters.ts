import { formatCurrency, formatNumber, formatAdaptiveNumber, formatAdaptiveCurrency, formatChartValue } from '@/utils/format-currency'

export interface FormatOptions {
  title?: string
  format?: 'number' | 'currency' | 'percentage'
  useAdaptive?: boolean
}

export interface AdaptiveDomain {
  min: number
  max: number
  useAdaptive: boolean
  scale: number
  unit: string
}


export const shouldUseAdaptiveFormatting = (data: any[], yAxisKey: string = 'value'): boolean => {
  if (!data || data.length === 0) return false

  const values: number[] = []

  data.forEach((item) => {
    if (typeof item === 'object' && item !== null) {

      Object.values(item).forEach((val) => {
        if (typeof val === 'number' && !Number.isNaN(val)) {
          values.push(Math.abs(val))
        }
      })
    } else if (typeof item === 'number') {
      values.push(Math.abs(item))
    }
  })

  if (values.length === 0) return false

  const maxValue = Math.max(...values)

  return maxValue >= 1000
}


export const calculateAdaptiveDomain = (
  data: any[],
  yAxisKey: string = 'value',
  seriesKeys: string[] = [],
  paddingPercent: number = 0.1
): AdaptiveDomain => {
  if (!data || data.length === 0) {
    return {
      min: 0,
      max: 100,
      useAdaptive: false,
      scale: 1,
      unit: '',
    }
  }

  const values: number[] = []

  data.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      if (seriesKeys.length > 0) {

        seriesKeys.forEach((key) => {
          const val = item[key]
          if (typeof val === 'number' && !Number.isNaN(val)) {
            values.push(Math.abs(val))
          }
        })
      } else {

        Object.values(item).forEach((val) => {
          if (typeof val === 'number' && !Number.isNaN(val) && val !== null && val !== undefined) {
            values.push(Math.abs(val))
          }
        })
      }
    } else if (typeof item === 'number') {
      values.push(Math.abs(item))
    }
  })

  if (values.length === 0) {
    return {
      min: 0,
      max: 100,
      useAdaptive: false,
      scale: 1,
      unit: '',
    }
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)


  const range = maxValue - minValue
  const padding = range * paddingPercent || maxValue * 0.1 || 10

  let adjustedMin = Math.max(0, minValue - padding)
  let adjustedMax = maxValue + padding


  const useAdaptive = maxValue >= 1000
  let scale = 1
  let unit = ''






  if (adjustedMax > 0) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(adjustedMax)))
    let roundedMax = Math.ceil(adjustedMax / magnitude) * magnitude


    const minRequiredMax = maxValue * 1.2

    if (roundedMax < minRequiredMax) {
      roundedMax = Math.ceil(minRequiredMax / magnitude) * magnitude

      if (roundedMax <= minRequiredMax) {
        roundedMax += magnitude
      }
    }

    adjustedMax = roundedMax
  }


  if (useAdaptive) {
    const adaptive = formatAdaptiveNumber(maxValue)
    scale = adaptive.scale
    unit = adaptive.unit
  }

  return {
    min: adjustedMin,
    max: adjustedMax,
    useAdaptive,
    scale,
    unit,
  }
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


  const str = String(tickItem)
  
  // Melhorar formatação de labels de semanas com datas
  if (str.includes('Sem ') && str.includes(':')) {
    // Formato: "Sem X: DD/MM/YYYY até DD/MM/YYYY"
    const parts = str.split(':')
    if (parts.length >= 2) {
      const weekPart = parts[0].trim() // "Sem X"
      const datePart = parts[1].trim().split(' até ')[0] // Primeira data
      // Em telas pequenas, mostrar apenas semana e data inicial
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        return `${weekPart}\n${datePart}`
      }
      // Em telas maiores, mostrar semana e range completo
      return `${weekPart}\n${parts[1].trim()}`
    }
  }
  
  // Melhorar formatação de tempo de conversão (ex: "7 dias" ao invés de "7d")
  if (str.includes('dias')) {
    return str
  }
  
  // Truncar strings longas em telas pequenas
  if (typeof window !== 'undefined' && window.innerWidth < 640 && str.length > 12) {
    return str.substring(0, 10) + '...'
  }

  return str
}

export const formatYAxis = (value: number, options: FormatOptions = {}): string => {
  const { title, format, useAdaptive } = options


  const shouldAdapt = useAdaptive !== false && (useAdaptive === true || Math.abs(value) >= 1000)

  if (format === 'currency' || title?.toLowerCase().includes('receita') || title?.toLowerCase().includes('valor')) {
    if (shouldAdapt) {
      const adaptive = formatAdaptiveCurrency(value)
      return adaptive.formatted
    }
    return formatCurrency(value)
  }

  if (format === 'percentage') {
    return `${value.toFixed(1)}%`
  }

  if (shouldAdapt) {
    return formatChartValue(value, true)
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

