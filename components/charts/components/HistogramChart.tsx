'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { HistogramChartProps } from '../types/chart-props'
import { useHistogramData } from '../hooks/useHistogramData'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function HistogramChart({
  config,
  data,
  bins = 10,
  height = 300,
}: Readonly<HistogramChartProps>) {
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const valueKey = config.yAxisKey || 'value'
  const histogramData = useHistogramData(data, valueKey, bins)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={responsiveHeight}>
          <BarChart data={histogramData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
            <XAxis 
              dataKey="range" 
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
            labelFormatter={(label) => `Intervalo: ${label}`}
            formatter={(value: number | undefined) => [`${value ?? 0} ocorrências`, 'Frequência']}
          />
          <Bar dataKey="count" fill={themeColors.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

