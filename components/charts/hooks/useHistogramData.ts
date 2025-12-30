import { useMemo } from 'react'

export interface HistogramBin {
  range: string
  count: number
  binStart: number
  binEnd: number
}

export const useHistogramData = (data: any[], valueKey: string, bins: number = 10): HistogramBin[] => {
  return useMemo(() => {
    const values = data.map((d) => Number(d[valueKey])).filter((v) => !Number.isNaN(v))
    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const binWidth = (max - min) / bins

    return Array.from({ length: bins }, (_, i) => {
      const binStart = min + i * binWidth
      const binEnd = binStart + binWidth
      const count = values.filter((v) => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length

      return {
        range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        binStart,
        binEnd,
      }
    })
  }, [data, valueKey, bins])
}

