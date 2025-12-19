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
import ChartContainer from './ChartContainer'
import type { TimeSeriesDataPoint, ChartConfig } from '@/types/charts'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import { useThemeColors } from './hooks/useThemeColors'

interface LineChartProps {
  config: ChartConfig
  data: TimeSeriesDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  showGrid?: boolean
  showLegend?: boolean
  height?: number
  onDataPointClick?: (data: TimeSeriesDataPoint) => void
}

export default function LineChart({
  config,
  data,
  series = [],
  showGrid = true,
  showLegend = true,
  height = 300,
  onDataPointClick,
}: Readonly<LineChartProps>) {
  const themeColors = useThemeColors()
  const xAxisKey = config.xAxisKey || 'date'
  const yAxisKey = config.yAxisKey || 'value'

  const formatXAxis = (tickItem: any) => {
    if (xAxisKey === 'date') {
      // Verifica se é uma data válida
      const date = new Date(tickItem)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        })
      }
      // Se não for uma data válida, retorna o valor original (ex: "0d", "30d")
      return tickItem
    }
    return tickItem
  }

  const formatYAxis = (value: number) => {
    if (config.title?.toLowerCase().includes('receita') || config.title?.toLowerCase().includes('valor')) {
      return formatCurrency(value)
    }
    return formatNumber(value)
  }

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />}
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            stroke={themeColors.foreground}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke={themeColors.foreground}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined) => formatYAxis(value || 0)}
            labelFormatter={(label) => formatXAxis(label)}
          />
          {showLegend && <Legend />}
          {series.length > 0 ? (
            series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={themeColors.primary}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

