'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { formatNumber, formatCurrency } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface GaugeChartProps {
  config: ChartConfig
  value: number
  min?: number
  max?: number
  thresholds?: Array<{ value: number; color: string; label: string }>
  height?: number
  format?: 'number' | 'currency' | 'percentage'
}

export default function GaugeChart({
  config,
  value,
  min = 0,
  max = 100,
  thresholds,
  height = 300,
  format = 'number',
}: Readonly<GaugeChartProps>) {
  const themeColors = useThemeColors()
  const defaultThresholds = thresholds || [
    { value: max * 0.7, color: themeColors.success, label: 'Bom' },
    { value: max * 0.4, color: themeColors.warning, label: 'Médio' },
    { value: min, color: themeColors.error, label: 'Baixo' },
  ]
  const percentage = ((value - min) / (max - min)) * 100
  const normalizedValue = Math.min(Math.max(value, min), max)

  const gaugeData = [
    { name: 'value', value: normalizedValue, fill: getColorForValue(normalizedValue) },
    { name: 'remaining', value: max - normalizedValue, fill: themeColors.gridColor },
  ]

  function getColorForValue(val: number): string {
    const sortedThresholds = [...defaultThresholds].sort((a, b) => b.value - a.value)
    for (const threshold of sortedThresholds) {
      if (val >= threshold.value) {
        return threshold.color
      }
    }
    return defaultThresholds.at(-1)?.color || themeColors.foreground
  }

  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${percentage.toFixed(1)}%`
      default:
        return formatNumber(value)
    }
  }

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="relative" style={{ height: `${height}px`, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={0}
              dataKey="value"
            >
              {gaugeData.map((entry) => (
                <Cell key={`cell-${entry.value}-${entry.fill}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold font-primary" style={{ color: themeColors.foreground }}>
            {formatValue()}
          </div>
          <div className="text-sm font-secondary mt-2" style={{ color: themeColors.foreground, opacity: 0.7 }}>
            {getColorForValue(normalizedValue) === themeColors.success && '✓ Meta atingida'}
            {getColorForValue(normalizedValue) === themeColors.warning && '⚠ Atenção'}
            {getColorForValue(normalizedValue) === themeColors.error && '✗ Abaixo do esperado'}
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}

