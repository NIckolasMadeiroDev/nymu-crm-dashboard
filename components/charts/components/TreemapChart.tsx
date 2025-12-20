'use client'

import { Treemap, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { TreemapChartProps } from '../types/chart-props'
import { useTreemapData } from '../hooks/useTreemapData'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function TreemapChart({ config, data, height = 300 }: Readonly<TreemapChartProps>) {
  const { xAxisKey, yAxisKey, formatValue } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const nameKey = xAxisKey
  const valueKey = yAxisKey
  const formattedData = useTreemapData(data, nameKey, valueKey)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={formattedData as any}
            dataKey={valueKey}
            aspectRatio={4 / 3}
            stroke={themeColors.background}
            fill={themeColors.primary}
          >
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={formatValue}
            labelFormatter={(label) => `Categoria: ${label}`}
          />
          {formattedData.map((entry, index) => {
            const colorIndex = index % themeColors.chartColors.length
            return <Cell key={`cell-${entry.name}-${entry.value}`} fill={themeColors.chartColors[colorIndex]} />
          })}
        </Treemap>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

