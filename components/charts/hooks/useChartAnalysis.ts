'use client'

import { useMemo } from 'react'
import { dataAnalysisService, type DataAnalysisResult } from '@/services/analytics/data-analysis-service'
import type { ChartDataPoint, TimeSeriesDataPoint } from '@/types/charts'

interface UseChartAnalysisOptions {
  previousData?: Array<{ value: number; label?: string; [key: string]: any }>
}

const normalizeTimeSeriesPoint = (item: TimeSeriesDataPoint) => {
  return {
    value: item.value,
    label: item.date ? new Date(item.date).toLocaleDateString('pt-BR') : undefined,
  }
}

const normalizeChartDataPoint = (item: ChartDataPoint) => {
  let nameLabel = ''
  if (typeof item.name === 'string') {
    nameLabel = item.name
  } else if (item.name) {
    nameLabel = String(item.name)
  }
  return {
    value: item.value,
    label: nameLabel,
  }
}

const normalizeLabelValue = (labelValue: unknown): string | undefined => {
  if (typeof labelValue === 'string') {
    return labelValue
  }
  if (labelValue === null || labelValue === undefined) {
    return undefined
  }
  if (typeof labelValue === 'object') {
    try {
      return JSON.stringify(labelValue)
    } catch {
      return undefined
    }
  }
  if (typeof labelValue === 'number' || typeof labelValue === 'boolean') {
    return String(labelValue)
  }
  return undefined
}

const normalizeValuePoint = (item: { value: number; label?: unknown; name?: unknown }) => {
  const labelValue = item.label || item.name
  const labelStr = normalizeLabelValue(labelValue)
  return {
    value: item.value,
    label: labelStr,
  }
}

const formatObjectLabel = (labelObj: Record<string, unknown>): string => {
  const keys = Object.keys(labelObj)
  if (keys.length === 0) return ''

  const keyTranslations: Record<string, string> = {
    date: 'Data',
    sevenDays: '7 dias',
    thirtyDays: '30 dias',
    ninetyDays: '90 dias',
    oneEightyDays: '180 dias',
    value: 'Valor',
    name: 'Nome',
    label: 'Rótulo',
  }

  const formattedPairs: string[] = []
  for (const key of keys) {
    const value = labelObj[key]
    if (value !== undefined && value !== null && typeof value === 'number') {
      const formattedKey = keyTranslations[key] || key
      formattedPairs.push(`${formattedKey}: ${value.toLocaleString('pt-BR')}`)
    } else if (value !== undefined && value !== null && typeof value === 'string') {
      const formattedKey = keyTranslations[key] || key
      formattedPairs.push(`${formattedKey}: ${value}`)
    }
  }

  return formattedPairs.length > 0 ? formattedPairs.join(' • ') : ''
}

const normalizeFallbackPoint = (item: any) => {
  let numericValue: number | undefined
  if ('value' in item && typeof item.value === 'number') {
    numericValue = item.value
  } else {
    const dateKeys = new Set(['date', 'name', 'label'])
    numericValue = Object.entries(item)
      .find(([key, val]) => !dateKeys.has(key) && typeof val === 'number')?.[1] as number | undefined
  }

  let fallbackLabelStr = ''
  if (item.date) {
    fallbackLabelStr = String(item.date)
  } else if (item.name) {
    fallbackLabelStr = typeof item.name === 'string' ? item.name : String(item.name)
  } else if (item.label) {
    if (typeof item.label === 'string') {
      fallbackLabelStr = item.label
    } else if (typeof item.label === 'object') {
      fallbackLabelStr = formatObjectLabel(item.label as Record<string, unknown>)
    } else {
      fallbackLabelStr = String(item.label)
    }
  } else {
    fallbackLabelStr = formatObjectLabel(item)
  }

  return {
    value: numericValue || 0,
    label: fallbackLabelStr || undefined,
  }
}

export const useChartAnalysis = (
  data: ChartDataPoint[] | TimeSeriesDataPoint[] | any[],
  options?: UseChartAnalysisOptions
): DataAnalysisResult => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        anomalies: [],
        insights: [],
        statistics: {
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          trend: 'stable',
        },
      }
    }

    const normalizedData = data.map((item) => {
      if ('date' in item && 'value' in item && typeof item.value === 'number') {
        return normalizeTimeSeriesPoint(item as TimeSeriesDataPoint)
      }
      if ('name' in item && 'value' in item && typeof item.value === 'number') {
        return normalizeChartDataPoint(item as ChartDataPoint)
      }
      if ('value' in item && typeof item.value === 'number') {
        return normalizeValuePoint(item)
      }
      if ('date' in item) {
        const numericValues = Object.values(item).filter((v): v is number => typeof v === 'number')
        const totalValue = numericValues.reduce((sum, val) => sum + val, 0)
        const formattedLabel = formatObjectLabel(item)
        return {
          value: totalValue,
          label: formattedLabel || undefined,
        }
      }
      return normalizeFallbackPoint(item)
    })

    return dataAnalysisService.analyzeData(normalizedData, options?.previousData)
  }, [data, options?.previousData])
}

