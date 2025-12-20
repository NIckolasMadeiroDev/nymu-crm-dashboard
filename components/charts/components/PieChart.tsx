'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartContainer from '../ChartContainer'
import type { PieChartProps } from '../types/chart-props'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function PieChart({
  config,
  data,
  donut = false,
  innerRadius = 0,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<PieChartProps>) {
  const { formatValue, xAxisKey, yAxisKey } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const valueKey = yAxisKey
  const nameKey = xAxisKey

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius="70%"
              innerRadius={donut ? (innerRadius || '40%') : 0}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={nameKey}
            >
            {data.map((entry) => {
              const index = data.indexOf(entry)
              return <Cell key={`cell-${entry.name}-${entry.value}`} fill={themeColors.chartColors[index % themeColors.chartColors.length]} />
            })}
          </Pie>
          <Tooltip
            formatter={formatValue}
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
        </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

