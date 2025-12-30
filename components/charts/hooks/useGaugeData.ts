import { useMemo } from 'react'

export interface GaugeThreshold {
  value: number
  color: string
  label: string
}

export const useGaugeData = (
  value: number,
  min: number,
  max: number,
  thresholds: GaugeThreshold[]
) => {
  return useMemo(() => {
    const normalizedValue = Math.min(Math.max(value, min), max)
    const color = getColorForValue(normalizedValue, thresholds)

    return {
      gaugeData: [
        { name: 'value', value: normalizedValue, fill: color },
        { name: 'remaining', value: max - normalizedValue, fill: '#e5e7eb' },
      ],
      percentage: ((value - min) / (max - min)) * 100,
      color,
    }
  }, [value, min, max, thresholds])
}

export const getColorForValue = (val: number, thresholds: GaugeThreshold[]): string => {
  const sortedThresholds = [...thresholds].sort((a, b) => b.value - a.value)
  for (const threshold of sortedThresholds) {
    if (val >= threshold.value) {
      return threshold.color
    }
  }
  return thresholds.at(-1)?.color || '#6b7280'
}

export const getGaugeStatus = (color: string): string => {
  if (color === '#10b981') return '✓ Meta atingida'
  if (color === '#f59e0b') return '⚠ Atenção'
  if (color === '#ef4444') return '✗ Abaixo do esperado'
  return ''
}

