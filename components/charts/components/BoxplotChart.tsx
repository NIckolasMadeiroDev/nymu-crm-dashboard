'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { BoxplotChartProps } from '../types/chart-props'
import { formatBoxplotLabel } from '../utils/chart-helpers'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function BoxplotChart({ config, data, height = 300 }: Readonly<BoxplotChartProps>) {
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  
  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
            <XAxis 
              dataKey="name" 
              stroke={themeColors.foreground} 
              style={{ fontSize: '10px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke={themeColors.foreground} style={{ fontSize: '10px' }} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              return [value ?? 0, formatBoxplotLabel(name)]
            }}
          />
          <Bar dataKey="q1" stackId="box" fill={themeColors.primary} />
          <Bar dataKey="median" stackId="box" fill={themeColors.accent} />
          <Bar dataKey="q3" stackId="box" fill={themeColors.primary} />
          {data.map((item) => (
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
          {data.map((item) => (
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
      </div>
    </ChartContainer>
  )
}

