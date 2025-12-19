'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartContainer from './ChartContainer'
import type { ChartDataPoint, ChartConfig } from '@/types/charts'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface BarChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  stacked?: boolean
  horizontal?: boolean
  showGrid?: boolean
  showLegend?: boolean
  height?: number
  onDataPointClick?: (data: ChartDataPoint) => void
}

export default function BarChart({
  config,
  data,
  series = [],
  stacked = false,
  horizontal = false,
  showGrid = true,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<BarChartProps>) {
  const themeColors = useThemeColors()
  const xAxisKey = config.xAxisKey || 'name'
  const yAxisKey = config.yAxisKey || 'value'

  const formatYAxis = (value: number) => {
    const titleLower = config.title?.toLowerCase() || ''
    if (titleLower.includes('receita') || titleLower.includes('valor')) {
      return formatCurrency(value)
    }
    return formatNumber(value)
  }

  const renderBars = () => {
    if (series.length > 0) {
      return series.map((s, index) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          stackId={stacked ? '1' : undefined}
          fill={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
          radius={[4, 4, 0, 0]}
        />
      ))
    }
    return (
      <Bar
        dataKey={yAxisKey}
        fill={themeColors.primary}
        radius={[4, 4, 0, 0]}
      />
    )
  }

  const renderXAxis = () => {
    return (
      <XAxis
        type={horizontal ? 'number' : 'category'}
        dataKey={horizontal ? undefined : xAxisKey}
        stroke={themeColors.foreground}
        style={{ fontSize: '12px' }}
        tickFormatter={horizontal ? formatYAxis : undefined}
      />
    )
  }

  const renderYAxis = () => {
    return (
      <YAxis
        type={horizontal ? 'category' : 'number'}
        dataKey={horizontal ? xAxisKey : undefined}
        tickFormatter={horizontal ? undefined : formatYAxis}
        stroke={themeColors.foreground}
        style={{ fontSize: '12px' }}
      />
    )
  }

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
          {renderXAxis()}
          {renderYAxis()}
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined, name: string | undefined) => [formatYAxis(value || 0), name || '']}
          />
          {showLegend && <Legend />}
          {renderBars()}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

