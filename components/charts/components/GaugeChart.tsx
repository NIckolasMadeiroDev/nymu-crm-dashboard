'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { GaugeChartProps } from '../types/chart-props'
import { useGaugeData, getGaugeStatus } from '../hooks/useGaugeData'
import { formatValue } from '../utils/value-formatters'
import { useThemeColors } from '../hooks/useThemeColors'

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
  const { gaugeData, color } = useGaugeData(value, min, max, defaultThresholds)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="relative" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
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
            {formatValue(value, format)}
          </div>
          <div className="text-sm font-secondary mt-2" style={{ color: themeColors.foreground, opacity: 0.7 }}>
            {getGaugeStatus(color)}
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}

