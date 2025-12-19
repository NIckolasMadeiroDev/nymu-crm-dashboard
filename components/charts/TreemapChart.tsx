'use client'

import { Treemap, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface TreemapData {
  name: string
  value: number
  children?: TreemapData[]
}

interface TreemapChartProps {
  config: ChartConfig
  data: TreemapData[]
  height?: number
}

export default function TreemapChart({ config, data, height = 300 }: Readonly<TreemapChartProps>) {
  const themeColors = useThemeColors()
  const valueKey = config.yAxisKey || 'value'
  const nameKey = config.xAxisKey || 'name'

  const formatData = (): TreemapData[] => {
    return data.map((item) => ({
      name: (item as Record<string, any>)[nameKey],
      value: (item as Record<string, any>)[valueKey],
      children: item.children ? formatData.call({ data: item.children }) : undefined,
    }))
  }

  const formattedData = formatData()

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <ResponsiveContainer width="100%" height={height}>
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
            formatter={(value: number | undefined) => formatNumber(value ?? 0)}
            labelFormatter={(label) => `Categoria: ${label}`}
          />
          {formattedData.map((entry, index) => {
            const colorIndex = index % themeColors.chartColors.length
            return <Cell key={`cell-${entry.name}-${entry.value}`} fill={themeColors.chartColors[colorIndex]} />
          })}
        </Treemap>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

