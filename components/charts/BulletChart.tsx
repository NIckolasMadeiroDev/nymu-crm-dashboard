'use client'

import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'
import { formatNumber, formatCurrency } from '@/utils/format-currency'

interface BulletData {
  title: string
  value: number
  target: number
  ranges: Array<{ value: number; color: string }>
  format?: 'number' | 'currency' | 'percentage'
}

interface BulletChartProps {
  config: ChartConfig
  data: BulletData[]
  height?: number
}

export default function BulletChart({ config, data, height = 300 }: Readonly<BulletChartProps>) {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return formatNumber(value)
    }
  }

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div className="space-y-6" style={{ minHeight: `${height}px` }}>
        {data.map((item, index) => {
          const maxValue = Math.max(item.value, item.target, ...item.ranges.map((r) => r.value))
          const valuePercentage = (item.value / maxValue) * 100
          const targetPercentage = (item.target / maxValue) * 100

          return (
            <div key={`bullet-${item.title}-${item.value}`} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 font-secondary">
                  {item.title}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 font-secondary">
                    Valor: {formatValue(item.value, item.format)}
                  </span>
                  <span className="text-sm text-gray-600 font-secondary">
                    Meta: {formatValue(item.target, item.format)}
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
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
                  className="absolute h-full bg-blue-600"
                  style={{
                    width: `${valuePercentage}%`,
                  }}
                />
                <div
                  className="absolute h-full w-1 bg-red-600"
                  style={{
                    left: `${targetPercentage}%`,
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

