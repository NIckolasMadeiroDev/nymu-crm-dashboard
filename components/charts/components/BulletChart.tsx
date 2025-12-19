'use client'

import ChartContainer from '../ChartContainer'
import type { BulletChartProps } from '../types/chart-props'
import { formatValue } from '../utils/value-formatters'
import { useThemeColors } from '../hooks/useThemeColors'

export default function BulletChart({ config, data, height = 300 }: Readonly<BulletChartProps>) {
  const themeColors = useThemeColors()
  
  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="space-y-6" style={{ minHeight: `${height}px` }}>
        {data.map((item) => {
          const maxValue = Math.max(item.value, item.target, ...item.ranges.map((r) => r.value))
          const valuePercentage = (item.value / maxValue) * 100
          const targetPercentage = (item.target / maxValue) * 100

          return (
            <div key={`bullet-${item.title}-${item.value}`} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-secondary" style={{ color: themeColors.foreground }}>
                  {item.title}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-secondary" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                    Valor: {formatValue(item.value, item.format as 'number' | 'currency' | 'percentage' | undefined)}
                  </span>
                  <span className="text-sm font-secondary" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                    Meta: {formatValue(item.target, item.format as 'number' | 'currency' | 'percentage' | undefined)}
                  </span>
                </div>
              </div>
              <div className="relative h-8 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.gridColor }}>
                {item.ranges.map((range, rangeIndex) => {
                  const rangePercentage = (range.value / maxValue) * 100
                  const previousRanges = item.ranges
                    .slice(0, rangeIndex)
                    .reduce((sum, r) => sum + (r.value / maxValue) * 100, 0)

                  return (
                    <div
                      key={`range-${item.title}-${range.value}-${rangeIndex}`}
                      className="absolute h-full"
                      style={{
                        left: `${previousRanges}%`,
                        width: `${rangePercentage}%`,
                        backgroundColor: range.color,
                        opacity: 0.3,
                      }}
                    />
                  )
                })}
                <div
                  className="absolute h-full"
                  style={{
                    width: `${valuePercentage}%`,
                    backgroundColor: themeColors.primary,
                  }}
                />
                <div
                  className="absolute h-full w-1"
                  style={{
                    left: `${targetPercentage}%`,
                    backgroundColor: themeColors.error,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </ChartContainer>
  )
}

