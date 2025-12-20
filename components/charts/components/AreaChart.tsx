'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartContainer from '../ChartContainer'
import type { AreaChartProps } from '../types/chart-props'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function AreaChart({
  config,
  data,
  series = [],
  stacked = false,
  showGrid = true,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<AreaChartProps>) {
  const { formatX, formatY, formatTooltip, xAxisKey, yAxisKey } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={formatX}
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatY}
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              width={50}
            />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={formatTooltip}
            labelFormatter={formatX}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
          {series.length > 0 ? (
            series.map((s, index) => {
              const color = s.color || themeColors.chartColors[index % themeColors.chartColors.length]
              return (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stackId={stacked ? '1' : undefined}
                  stroke={color}
                  fill={s.fill || color}
                  fillOpacity={0.6}
                />
              )
            })
          ) : (
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={themeColors.primary}
              fill={themeColors.primary}
              fillOpacity={0.6}
            />
          )}
        </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

