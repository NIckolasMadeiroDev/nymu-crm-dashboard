'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { BubbleChartProps } from '../types/chart-props'
import { formatNumber } from '@/utils/format-currency'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function BubbleChart({
  config,
  data,
  series = [],
  height = 300,
}: Readonly<BubbleChartProps>) {
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={responsiveHeight}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
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
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Tamanho" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: themeColors.tooltipBackground,
              border: `1px solid ${themeColors.tooltipBorder}`,
              borderRadius: '8px',
              color: themeColors.tooltipText,
            }}
            formatter={(value: number | undefined = 0, name: string | undefined = '') => {
              if (name === 'z') return [formatNumber(value ?? 0), 'Tamanho']
              return [formatNumber(value ?? 0), name.toUpperCase()]
            }}
          />
          {series.length > 0 ? (
            series.map((s, index) => (
              <Scatter
                key={s.key}
                name={s.name}
                data={data.filter((d) => d.category === s.key)}
                fill={s.color || themeColors.chartColors[index % themeColors.chartColors.length]}
              />
            ))
          ) : (
            <Scatter name="Data" data={data} fill={themeColors.primary} />
          )}
          {series.length > 0 && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
        </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

