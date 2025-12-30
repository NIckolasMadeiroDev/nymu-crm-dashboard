'use client'

import { Treemap, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import ChartContainer from '../ChartContainer'
import type { TreemapChartProps } from '../types/chart-props'
import { useTreemapData } from '../hooks/useTreemapData'
import { useChartFormatters } from '../hooks/useChartFormatters'
import { useThemeColors } from '../hooks/useThemeColors'
import { useResponsiveHeight } from '../hooks/useResponsiveHeight'

export default function TreemapChart({ config, data, height = 300, onDataPointClick }: Readonly<TreemapChartProps>) {
  const { xAxisKey, yAxisKey, formatValue } = useChartFormatters(config)
  const themeColors = useThemeColors()
  const responsiveHeight = useResponsiveHeight(height)
  const nameKey = xAxisKey
  const valueKey = yAxisKey
  const formattedData = useTreemapData(data, nameKey, valueKey)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="w-full h-full overflow-hidden" style={{ minHeight: responsiveHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={responsiveHeight}>
          <Treemap
            data={formattedData as any}
            dataKey={valueKey}
            aspectRatio={4 / 3}
            stroke={themeColors.background}
            fill={themeColors.primary}
            onClick={onDataPointClick ? (node: any) => {
              console.log('[TreemapChart] Treemap onClick event:', { node })
              // No Recharts, o onClick do Treemap recebe (node: TreemapNode)
              // onde node contém as propriedades do nó clicado
              if (node && typeof node === 'object') {
                // Extrair os dados do nó (pode estar em node.payload ou diretamente no node)
                const data = node.payload || node
                console.log('[TreemapChart] Calling onDataPointClick with data:', data)
                onDataPointClick(data)
              }
            } : undefined}
            style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
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

