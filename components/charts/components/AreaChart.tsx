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
  
  // Armazenar xAxisKey para usar no onClick
  const chartXAxisKey = xAxisKey

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
            onClick={onDataPointClick ? (chartData: any, index: number) => {
              console.log('[RechartsAreaChart] Chart onClick:', { chartData, index, data, dataLength: data?.length })
              // No Recharts, o onClick do AreaChart recebe um objeto com activeIndex, activeLabel, etc.
              if (chartData && typeof chartData === 'object') {
                let payload: any = null
                
                // Tentar usar activePayload primeiro
                if (chartData.activePayload && chartData.activePayload.length > 0) {
                  payload = chartData.activePayload[0].payload
                  console.log('[RechartsAreaChart] Using activePayload:', payload)
                } 
                // Se não tem activePayload, usar activeIndex para buscar no array data
                else if (chartData.activeIndex !== undefined && data && Array.isArray(data)) {
                  const activeIndex = typeof chartData.activeIndex === 'string' 
                    ? Number.parseInt(chartData.activeIndex, 10) 
                    : Number(chartData.activeIndex)
                  console.log('[RechartsAreaChart] Parsed activeIndex:', activeIndex, 'from', chartData.activeIndex)
                  if (!isNaN(activeIndex) && activeIndex >= 0 && activeIndex < data.length) {
                    payload = data[activeIndex]
                    console.log('[RechartsAreaChart] Using activeIndex to get data:', payload)
                  } else {
                    console.warn('[RechartsAreaChart] Invalid activeIndex:', activeIndex, 'data.length:', data.length)
                  }
                }
                // Fallback: se tem activeLabel, tentar encontrar no array
                else if (chartData.activeLabel && data && Array.isArray(data)) {
                  const key = chartXAxisKey || 'name'
                  payload = data.find((item: any) => item[key] === chartData.activeLabel)
                  if (payload) {
                    console.log('[RechartsAreaChart] Using activeLabel to find data:', payload)
                  } else {
                    console.warn('[RechartsAreaChart] Could not find data with', key, '=', chartData.activeLabel)
                  }
                }
                
                if (payload) {
                  console.log('[RechartsAreaChart] Calling onDataPointClick with payload:', payload)
                  onDataPointClick(payload)
                } else {
                  console.warn('[RechartsAreaChart] Could not extract payload from chartData:', chartData)
                }
              }
            } : undefined}
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
                  style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
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
              style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
            />
          )}
        </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

