'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartContainer from './ChartContainer'
import type { ChartDataPoint, ChartConfig } from '@/types/charts'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface PieChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
  donut?: boolean
  innerRadius?: number
  showLegend?: boolean
  height?: number
  onDataPointClick?: (data: ChartDataPoint) => void
}

export default function PieChart({
  config,
  data,
  donut = false,
  innerRadius = 0,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<PieChartProps>) {
  const themeColors = useThemeColors()
  const valueKey = config.yAxisKey || 'value'
  const nameKey = config.xAxisKey || 'name'

  const formatValue = (value: number) => {
    if (config.title?.toLowerCase().includes('receita') || config.title?.toLowerCase().includes('valor')) {
      return formatCurrency(value)
    }
    return formatNumber(value)
  }

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            innerRadius={donut ? (innerRadius || 40) : 0}
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
            formatter={(value: number | undefined) => formatValue(value || 0)}
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
          />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

