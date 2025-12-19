'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface SunburstData {
  name: string
  value: number
  children?: SunburstData[]
  level?: number
}

interface SunburstChartProps {
  config: ChartConfig
  data: SunburstData[]
  height?: number
}

export default function SunburstChart({ config, data, height = 300 }: Readonly<SunburstChartProps>) {
  const themeColors = useThemeColors()
  const valueKey = config.yAxisKey || 'value'
  const nameKey = config.xAxisKey || 'name'

  const flattenData = (items: SunburstData[], level = 0): any[] => {
    const result: any[] = []
    items.forEach((item) => {
      result.push({
        name: (item as Record<string, any>)[nameKey],
        value: (item as Record<string, any>)[valueKey],
        level,
      })
      if (item.children) {
        result.push(...flattenData(item.children, level + 1))
      }
    })
    return result
  }

  const formattedData = flattenData(data)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
          >
            {formattedData.map((entry) => {
              const index = formattedData.indexOf(entry)
              return <Cell key={`cell-${entry.name}-${entry.value}`} fill={themeColors.chartColors[index % themeColors.chartColors.length]} />
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined) => formatNumber(value ?? 0)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

