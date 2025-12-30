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
import { useResponsiveChart } from '../hooks/useResponsiveChart'

const renderBars = (
  series: Array<{ key: string; name: string; color?: string }>,
  stacked: boolean,
  yAxisKey: string,
  themeColors: ReturnType<typeof useThemeColors>,
  data: any[],
  onDataPointClick?: (data: any) => void
) => {
  // Remover função handleBarClick - não é mais necessária

  if (series.length > 0) {
    return series.map((s, index) => (
      <Bar
        key={s.key}
        dataKey={s.key}
        name={s.name}
        stackId={stacked ? '1' : undefined}
        fill={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
        radius={[4, 4, 0, 0]}
        onClick={onDataPointClick ? (entry: any, index: number) => {
          console.log('[BarChart] Bar onClick event:', { entry, index, s })
          // No Recharts, o onClick do Bar recebe (entry, index)
          // onde entry é o objeto do ponto de dados do array data
          if (entry && typeof entry === 'object') {
            const result = { ...entry }
            result.seriesKey = s.key
            result.seriesName = s.name
            console.log('[BarChart] Calling onDataPointClick with result:', result)
            onDataPointClick(result)
          }
        } : undefined}
        style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
      />
    ))
  }
  return (
    <Bar
      dataKey={yAxisKey}
      fill={themeColors.primary}
      radius={[4, 4, 0, 0]}
      onClick={onDataPointClick ? (entry: any, index: number) => {
        console.log('[BarChart] Single Bar onClick event:', { entry, index })
        if (entry && typeof entry === 'object') {
          console.log('[BarChart] Calling onDataPointClick with entry:', entry)
          onDataPointClick(entry)
        }
      } : undefined}
      style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
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
  const { formatY, formatTooltip, xAxisKey, yAxisKey, adaptiveDomain } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const responsiveChart = useResponsiveChart()

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
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={responsiveHeight}>
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{
              top: 5,
              right: responsiveChart.marginRight,
              left: horizontal ? responsiveChart.yAxisWidth : responsiveChart.marginLeft,
              bottom: horizontal ? 0 : responsiveChart.marginBottom,
            }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
            <XAxis
              type={xAxisType}
              dataKey={xAxisDataKey}
              stroke={themeColors.foreground}
              style={{ fontSize: responsiveChart.fontSize }}
              tickFormatter={xAxisFormatter}
              angle={horizontal ? 0 : responsiveChart.xAxisAngle}
              textAnchor={horizontal ? 'middle' : 'end'}
              height={horizontal ? 0 : responsiveChart.xAxisHeight}
              interval="preserveStartEnd"
            />
            <YAxis
              type={yAxisType}
              dataKey={yAxisDataKey}
              tickFormatter={yAxisFormatter}
              stroke={themeColors.foreground}
              style={{ fontSize: responsiveChart.fontSize }}
              width={horizontal ? responsiveChart.yAxisWidth : responsiveChart.yAxisWidth}
              tickCount={responsiveChart.tickCount}
              domain={adaptiveDomain && !horizontal ? [adaptiveDomain.min, adaptiveDomain.max] : ['auto', 'auto']}
              label={adaptiveDomain?.unit && !horizontal ? { value: `(${adaptiveDomain.unit})`, angle: -90, position: 'insideLeft', style: { fontSize: '9px' } } : undefined}
            />
            {horizontal && adaptiveDomain && (
              <XAxis
                type="number"
                domain={[adaptiveDomain.min, adaptiveDomain.max]}
                tickFormatter={formatY}
                stroke={themeColors.foreground}
                style={{ fontSize: responsiveChart.fontSize }}
                label={adaptiveDomain.unit ? { value: `(${adaptiveDomain.unit})`, position: 'bottom', style: { fontSize: '9px' } } : undefined}
              />
            )}
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
          {renderBars(series, stacked, yAxisKey, themeColors, data, onDataPointClick)}
        </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

