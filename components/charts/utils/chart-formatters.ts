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

/**
 * Detecta se os valores do conjunto de dados são muito altos e requerem formatação adaptativa
 */
export const shouldUseAdaptiveFormatting = (data: any[], yAxisKey: string = 'value'): boolean => {
  if (!data || data.length === 0) return false

  const values: number[] = []
  
  data.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      // Se tem múltiplas séries, verificar todas
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
  // Usar formatação adaptativa se algum valor for >= 1000
  return maxValue >= 1000
}

/**
 * Calcula o domínio adaptativo do eixo Y baseado nos valores dos dados
 * Aumenta automaticamente o limite máximo quando valores são altos
 */
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
        // Se tem séries específicas, verificar apenas essas
        seriesKeys.forEach((key) => {
          const val = item[key]
          if (typeof val === 'number' && !Number.isNaN(val)) {
            values.push(Math.abs(val))
          }
        })
      } else {
        // Verificar todas as propriedades numéricas
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
  
  // Calcular padding
  const range = maxValue - minValue
  const padding = range * paddingPercent || maxValue * 0.1 || 10
  
  let adjustedMin = Math.max(0, minValue - padding)
  let adjustedMax = maxValue + padding
  
  // Detectar se precisa usar formatação adaptativa
  const useAdaptive = maxValue >= 1000
  let scale = 1
  let unit = ''
  
  // Calcular domínio com valores originais (não escalados)
  // O domínio será usado diretamente pelo Recharts
  // A formatação adaptativa será aplicada apenas nos labels e tooltips
  
  // Arredondar para valores "bonitos" usando valores originais
  if (adjustedMax > 0) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(adjustedMax)))
    let roundedMax = Math.ceil(adjustedMax / magnitude) * magnitude
    
    // Garantir que o máximo seja pelo menos 20% maior que o valor máximo real
    const minRequiredMax = maxValue * 1.2
    
    if (roundedMax < minRequiredMax) {
      roundedMax = Math.ceil(minRequiredMax / magnitude) * magnitude
      // Se ainda não for suficiente, adicionar mais uma magnitude
      if (roundedMax <= minRequiredMax) {
        roundedMax += magnitude
      }
    }
    
    adjustedMax = roundedMax
  }
  
  // Calcular escala e unidade para formatação (apenas para labels/tooltips)
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
  
  // Truncar labels muito longos em telas pequenas
  const str = String(tickItem)
  if (typeof window !== 'undefined' && window.innerWidth < 640 && str.length > 8) {
    return str.substring(0, 6) + '...'
  }
  
  return str
}

export const formatYAxis = (value: number, options: FormatOptions = {}): string => {
  const { title, format, useAdaptive } = options
  
  // Determinar se deve usar formatação adaptativa
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

