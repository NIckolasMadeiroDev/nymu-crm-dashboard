'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { useThemeColors } from './hooks/useThemeColors'

interface BoxplotData {
  name: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean?: number
}

interface BoxplotChartProps {
  config: ChartConfig
  data: BoxplotData[]
  height?: number
}

export default function BoxplotChart({ config, data, height = 300 }: Readonly<BoxplotChartProps>) {
  const themeColors = useThemeColors()
  
  const formatBoxplotData = () => {
    return data.map((item) => ({
      name: item.name,
      min: item.min,
      q1: item.q1,
      median: item.median,
      q3: item.q3,
      max: item.max,
      mean: item.mean,
    }))
  }

  const formattedData = formatBoxplotData()

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formattedData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
          <XAxis dataKey="name" stroke={themeColors.foreground} style={{ fontSize: '12px' }} />
          <YAxis stroke={themeColors.foreground} style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const labels: Record<string, string> = {
                min: 'Mínimo',
                q1: 'Q1 (25%)',
                median: 'Mediana',
                q3: 'Q3 (75%)',
                max: 'Máximo',
                mean: 'Média',
              }
              return [value ?? 0, labels[name || ''] || name || '']
            }}
          />
          <Bar dataKey="q1" stackId="box" fill={themeColors.primary} />
          <Bar dataKey="median" stackId="box" fill={themeColors.accent} />
          <Bar dataKey="q3" stackId="box" fill={themeColors.primary} />
          {formattedData.map((item) => (
            <ReferenceLine
              key={`whisker-${item.name}`}
              x={item.name}
              segment={[
                { x: item.name, y: item.min },
                { x: item.name, y: item.q1 },
              ]}
              stroke={themeColors.foreground}
              strokeWidth={2}
            />
          ))}
          {formattedData.map((item) => (
            <ReferenceLine
              key={`whisker-top-${item.name}`}
              x={item.name}
              segment={[
                { x: item.name, y: item.q3 },
                { x: item.name, y: item.max },
              ]}
              stroke={themeColors.foreground}
              strokeWidth={2}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

