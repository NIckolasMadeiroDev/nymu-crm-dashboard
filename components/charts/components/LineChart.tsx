'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartContainer from '../ChartContainer'
import type { LineChartProps } from '../types/chart-props'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'
import { useResponsiveChart } from '../hooks/useResponsiveChart'
import { EnhancedTooltip } from './EnhancedTooltip'

export default function LineChart({
  config,
  data,
  series = [],
  showGrid = true,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<LineChartProps>) {
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
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: responsiveChart.marginRight,
              left: responsiveChart.marginLeft,
              bottom: responsiveChart.marginBottom,
            }}
            onClick={onDataPointClick ? (nextState: any, event: any) => {
              console.log('[RechartsLineChart] Chart onClick:', { nextState, event, data, dataLength: data?.length })
              // No Recharts, o onClick recebe (nextState, event)
              // nextState contém activeIndex, activeLabel, activePayload, etc.
              if (nextState && typeof nextState === 'object') {
                let payload: any = null
                
                // Tentar usar activePayload primeiro
                if (nextState.activePayload && nextState.activePayload.length > 0) {
                  payload = nextState.activePayload[0].payload
                  console.log('[RechartsLineChart] Using activePayload:', payload)
                } 
                // Se não tem activePayload, usar activeIndex para buscar no array data
                else if (nextState.activeIndex !== undefined && data && Array.isArray(data)) {
                  const activeIndex = typeof nextState.activeIndex === 'string' 
                    ? Number.parseInt(nextState.activeIndex, 10) 
                    : Number(nextState.activeIndex)
                  console.log('[RechartsLineChart] Parsed activeIndex:', activeIndex, 'from', nextState.activeIndex)
                  if (!Number.isNaN(activeIndex) && activeIndex >= 0 && activeIndex < data.length) {
                    payload = data[activeIndex]
                    console.log('[RechartsLineChart] Using activeIndex to get data:', payload)
                  } else {
                    console.warn('[RechartsLineChart] Invalid activeIndex:', activeIndex, 'data.length:', data.length)
                  }
                }
                // Fallback: se tem activeLabel, tentar encontrar no array
                else if (nextState.activeLabel && data && Array.isArray(data)) {
                  const key = chartXAxisKey || 'name'
                  payload = data.find((item: any) => item[key] === nextState.activeLabel)
                  if (payload) {
                    console.log('[RechartsLineChart] Using activeLabel to find data:', payload)
                  } else {
                    console.warn('[RechartsLineChart] Could not find data with', key, '=', nextState.activeLabel)
                  }
                }
                
                if (payload) {
                  console.log('[RechartsLineChart] Calling onDataPointClick with payload:', payload)
                  onDataPointClick(payload)
                } else {
                  console.warn('[RechartsLineChart] Could not extract payload from nextState:', nextState)
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
              tick={{ style: { fontSize: responsiveChart.fontSize } }}
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
            content={<EnhancedTooltip showFullDetails={true} />}
            wrapperStyle={{ zIndex: 1000 }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
          {series.length > 0 ? (
            series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5, onClick: onDataPointClick ? (dotProps: any, e: any) => {
                  console.log('[LineChart] activeDot onClick:', { dotProps, e, s })
                  if (dotProps?.payload) {
                    const result = { ...dotProps.payload }
                    result.seriesKey = s.key
                    result.seriesName = s.name
                    onDataPointClick(result)
                  }
                } : undefined }}
                style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={themeColors.primary}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5, onClick: onDataPointClick ? (dotProps: any, e: any) => {
                console.log('[LineChart] Single activeDot onClick:', { dotProps, e })
                if (dotProps?.payload) {
                  onDataPointClick(dotProps.payload)
                }
              } : undefined }}
              style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
            />
          )}
        </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

