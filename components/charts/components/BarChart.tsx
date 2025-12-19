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
import ChartContainer from '../ChartContainer'
import type { BarChartProps } from '../types/chart-props'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

const renderBars = (
  series: Array<{ key: string; name: string; color?: string }>,
  stacked: boolean,
  yAxisKey: string,
  themeColors: ReturnType<typeof useThemeColors>
) => {
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
  const { formatY, formatTooltip, xAxisKey, yAxisKey } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)

  const xAxisType = horizontal ? 'number' : 'category'
  const yAxisType = horizontal ? 'category' : 'number'
  const xAxisDataKey = horizontal ? undefined : xAxisKey
  const yAxisDataKey = horizontal ? xAxisKey : undefined
  const xAxisFormatter = horizontal ? formatY : undefined
  const yAxisFormatter = horizontal ? undefined : formatY

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <div className="w-full h-full overflow-hidden">
        <ResponsiveContainer width="100%" height={responsiveHeight}>
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 10, left: horizontal ? 60 : -10, bottom: horizontal ? 0 : 60 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
            <XAxis
              type={xAxisType}
              dataKey={xAxisDataKey}
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              tickFormatter={xAxisFormatter}
              angle={horizontal ? 0 : -45}
              textAnchor={horizontal ? 'middle' : 'end'}
              height={horizontal ? 0 : 60}
              interval="preserveStartEnd"
            />
            <YAxis
              type={yAxisType}
              dataKey={yAxisDataKey}
              tickFormatter={yAxisFormatter}
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              width={horizontal ? 60 : 50}
            />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={formatTooltip}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
          {renderBars(series, stacked, yAxisKey, themeColors)}
        </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

