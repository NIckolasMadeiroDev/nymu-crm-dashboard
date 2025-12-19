import { useMemo } from 'react'

export const useCorrelationMatrix = (data: Array<Record<string, number>>, metrics: string[]) => {
  return useMemo(() => {
    const calculateCorrelation = (values1: number[], values2: number[]): number => {
      if (values1.length !== values2.length || values1.length === 0) return 0
      
      const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
      const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length
      
      const numerator = values1.reduce((sum, _, i) => {
        return sum + (values1[i] - mean1) * (values2[i] - mean2)
      }, 0)
      
      const denom1 = Math.sqrt(values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0))
      const denom2 = Math.sqrt(values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0))
      
      if (denom1 * denom2 === 0) return 0
      return numerator / (denom1 * denom2)
    }

    const getMetricValues = (metric: string): number[] => {
      return data.map((d) => d[metric]).filter((v) => !Number.isNaN(v))
    }

    const matrix: number[][] = []
    
    metrics.forEach((metric1) => {
      const row: number[] = []
      metrics.forEach((metric2) => {
        if (metric1 === metric2) {
          row.push(1)
        } else {
          const values1 = getMetricValues(metric1)
          const values2 = getMetricValues(metric2)
          const correlation = calculateCorrelation(values1, values2)
          row.push(correlation)
        }
      })
      matrix.push(row)
    })
    
    return matrix
  }, [data, metrics])
}

export const getCorrelationColor = (
  value: number,
  themeColors?: { success: string; primary: string; warning: string; error: string; gridColor: string }
): string => {
  if (!themeColors) {
    // Fallback para cores padrão
    if (value >= 0.7) return '#10b981'
    if (value >= 0.3) return '#3b82f6'
    if (value >= -0.3) return '#e5e7eb'
    if (value >= -0.7) return '#f59e0b'
    return '#ef4444'
  }
  
  if (value >= 0.7) return themeColors.success
  if (value >= 0.3) return themeColors.primary
  if (value >= -0.3) return themeColors.gridColor
  if (value >= -0.7) return themeColors.warning
  return themeColors.error
}

