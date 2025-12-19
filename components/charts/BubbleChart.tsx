'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface BubbleDataPoint {
  x: number
  y: number
  z: number
  name?: string
  category?: string
}

interface BubbleChartProps {
  config: ChartConfig
  data: BubbleDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  height?: number
}

export default function BubbleChart({
  config,
  data,
  series = [],
  height = 300,
}: Readonly<BubbleChartProps>) {
  const themeColors = useThemeColors()
  
  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
          <XAxis
            type="number"
            dataKey="x"
            name="X"
            stroke={themeColors.foreground}
            style={{ fontSize: '12px' }}
            label={{ value: config.xAxisLabel || 'X', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Y"
            stroke={themeColors.foreground}
            style={{ fontSize: '12px' }}
            label={{ value: config.yAxisLabel || 'Y', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Tamanho" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined = 0, name: string | undefined = '') => {
              if (name === 'z') return [formatNumber(value ?? 0), 'Tamanho']
              return [formatNumber(value ?? 0), name.toUpperCase()]
            }}
          />
          {series.length > 0 ? (
            series.map((s, index) => (
              <Scatter
                key={s.key}
                name={s.name}
                data={data.filter((d) => d.category === s.key)}
                fill={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
              />
            ))
          ) : (
            <Scatter name="Data" data={data} fill={themeColors.primary} />
          )}
          {series.length > 0 && <Legend />}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

