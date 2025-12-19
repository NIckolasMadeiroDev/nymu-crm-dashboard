'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { useThemeColors } from './hooks/useThemeColors'

interface HistogramChartProps {
  config: ChartConfig
  data: any[]
  bins?: number
  height?: number
}

export default function HistogramChart({
  config,
  data,
  bins = 10,
  height = 300,
}: Readonly<HistogramChartProps>) {
  const themeColors = useThemeColors()
  const valueKey = config.yAxisKey || 'value'

  const createBins = () => {
    const values = data.map((d) => Number(d[valueKey])).filter((v) => !Number.isNaN(v))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binWidth = (max - min) / bins

    const histogramData = Array.from({ length: bins }, (_, i) => {
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

    return histogramData
  }

  const histogramData = createBins()

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
          <XAxis dataKey="range" stroke={themeColors.foreground} style={{ fontSize: '12px' }} />
          <YAxis stroke={themeColors.foreground} style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            labelFormatter={(label) => `Intervalo: ${label}`}
            formatter={(value: number | undefined) => [`${value ?? 0} ocorrências`, 'Frequência']}
          />
          <Bar dataKey="count" fill={themeColors.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

