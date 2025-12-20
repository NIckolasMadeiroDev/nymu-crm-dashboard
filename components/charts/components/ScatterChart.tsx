'use client'

import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import ChartContainer from '../ChartContainer'
import type { ScatterChartProps } from '../types/chart-props'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function ScatterChart({
  config,
  data,
  series = [],
  showGrid = true,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<ScatterChartProps>) {
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
          <RechartsScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
            <XAxis
              type="number"
              dataKey="x"
              name="X"
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              width={50}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              stroke={themeColors.foreground}
              style={{ fontSize: '10px' }}
              width={50}
            />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
          {series.length > 0 ? (
            series.map((s, index) => {
              const filteredData = data.filter((d) => d.category === s.key)
              const color = s.color || themeColors.chartColors[index % themeColors.chartColors.length]
              return (
                <Scatter
                  key={s.key}
                  name={s.name}
                  data={filteredData}
                  fill={color}
                >
                  {filteredData.map((entry) => (
                    <Cell key={`cell-${entry.x}-${entry.y}-${s.key}`} fill={color} />
                  ))}
                </Scatter>
              )
            })
          ) : (
            <Scatter
              name="Data"
              data={data}
              fill={themeColors.primary}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.x}-${entry.y}`} fill={themeColors.primary} />
              ))}
            </Scatter>
          )}
        </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

