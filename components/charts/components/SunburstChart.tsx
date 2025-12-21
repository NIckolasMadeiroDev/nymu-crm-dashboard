'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { SunburstChartProps } from '../types/chart-props'
import { useSunburstData } from '../hooks/useSunburstData'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function SunburstChart({ config, data, height = 300 }: Readonly<SunburstChartProps>) {
  const { xAxisKey, yAxisKey, formatValue } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const nameKey = xAxisKey
  const valueKey = yAxisKey
  const formattedData = useSunburstData(data, nameKey, valueKey)

  const chartData = formattedData.map((item) => ({
    ...item,
    [nameKey]: item.name,
    [valueKey]: item.value,
  }))

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={responsiveHeight}>
          <PieChart>
            <Pie
              data={chartData as Array<Record<string, unknown>>}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius="70%"
              fill="#8884d8"
              dataKey={valueKey}
            >
            {formattedData.map((entry) => {
              const index = formattedData.indexOf(entry)
              return <Cell key={`cell-${entry.name}-${entry.value}`} fill={themeColors.chartColors[index % themeColors.chartColors.length]} />
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={formatValue}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

