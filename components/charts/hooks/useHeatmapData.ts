import { useMemo } from 'react'
import type { HeatmapDataPoint } from '@/types/charts'

export const useHeatmapData = (data: HeatmapDataPoint[]) => {
  return useMemo(() => {
    const xSet = new Set<string>()
    const ySet = new Set<string>()
    let max = -Infinity
    let min = Infinity

    data.forEach((point) => {
      xSet.add(point.x)
      ySet.add(point.y)
      max = Math.max(max, point.value)
      min = Math.min(min, point.value)
    })

    return {
      xLabels: Array.from(xSet).sort((a, b) => a.localeCompare(b)),
      yLabels: Array.from(ySet).sort((a, b) => a.localeCompare(b)),
      maxValue: max,
      minValue: min,
    }
  }, [data])
}

export const getHeatmapColor = (
  value: number,
  minValue: number,
  maxValue: number,
  themeColors?: { primary: string; info: string }
): string => {
  const range = maxValue - minValue
  if (range === 0) {
    return themeColors?.info || '#06b6d4'
  }
  const ratio = (value - minValue) / range
  
  // Usar gradiente baseado na cor primária do tema
  const baseColor = themeColors?.primary || '#3b82f6'
  
  // Converter hex para RGB para criar gradiente
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }
  }
  
  const rgb = hexToRgb(baseColor)
  const opacity = 0.2 + ratio * 0.8 // De 0.2 a 1.0
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

export const getHeatmapValue = (data: HeatmapDataPoint[], x: string, y: string): number => {
  return data.find((d) => d.x === x && d.y === y)?.value || 0
}

