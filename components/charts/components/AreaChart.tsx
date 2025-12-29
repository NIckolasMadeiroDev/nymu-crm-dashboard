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
import { useResponsiveChart } from '../hooks/useResponsiveChart'

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
  const { formatX, formatY, formatTooltip, xAxisKey, yAxisKey, adaptiveDomain } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const responsiveChart = useResponsiveChart()

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={responsiveHeight}>
          <RechartsAreaChart 
            data={data} 
            margin={{ 
              top: 5, 
              right: responsiveChart.marginRight,
              left: responsiveChart.marginLeft,
              bottom: responsiveChart.marginBottom,
            }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={formatX}
              stroke={themeColors.foreground}
              style={{ fontSize: responsiveChart.fontSize }}
              angle={responsiveChart.xAxisAngle}
              textAnchor="end"
              height={responsiveChart.xAxisHeight}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatY}
              stroke={themeColors.foreground}
              style={{ fontSize: responsiveChart.fontSize }}
              width={responsiveChart.yAxisWidth}
              tickCount={responsiveChart.tickCount}
              domain={adaptiveDomain ? [Math.max(0, adaptiveDomain.min), adaptiveDomain.max] : ['auto', 'auto']}
              label={adaptiveDomain?.unit ? { value: `(${adaptiveDomain.unit})`, angle: -90, position: 'insideLeft', style: { fontSize: '9px' } } : undefined}
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

