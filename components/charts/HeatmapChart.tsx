'use client'

import { useMemo } from 'react'
import ChartContainer from './ChartContainer'
import type { HeatmapDataPoint, ChartConfig } from '@/types/charts'

interface HeatmapChartProps {
  config: ChartConfig
  data: HeatmapDataPoint[]
  height?: number
  onDataPointClick?: (data: HeatmapDataPoint) => void
}

export default function HeatmapChart({
  config,
  data,
  height = 300,
  onDataPointClick,
}: Readonly<HeatmapChartProps>) {
  const { xLabels, yLabels, maxValue, minValue } = useMemo(() => {
    const xSet = new Set<string>()
    const ySet = new Set<string>()
    let max = -Infinity
    let min = Infinity

    data.forEach((point) => {
      xSet.add(point.x)
      ySet.add(point.y)
      max = Math.max(max, point.value)
      min = Math.min(min, point.value)
    })

    return {
      xLabels: Array.from(xSet).sort((a, b) => a.localeCompare(b)),
      yLabels: Array.from(ySet).sort((a, b) => a.localeCompare(b)),
      maxValue: max,
      minValue: min,
    }
  }, [data])

  const getColor = (value: number) => {
    const range = maxValue - minValue
    if (range === 0) return 'bg-blue-200'
    const ratio = (value - minValue) / range
    if (ratio < 0.2) return 'bg-blue-100'
    if (ratio < 0.4) return 'bg-blue-300'
    if (ratio < 0.6) return 'bg-blue-500'
    if (ratio < 0.8) return 'bg-blue-700'
    return 'bg-blue-900'
  }

  const getValue = (x: string, y: string) => {
    return data.find((d) => d.x === x && d.y === y)?.value || 0
  }

  return (
    <ChartContainer
      title={config.title}
      subtitle={config.subtitle}
      onDrillDown={onDataPointClick ? () => {} : undefined}
    >
      <div className="overflow-x-auto">
        <div style={{ height: `${height}px` }} className="min-w-full">
          <table className="w-full h-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 p-2 text-xs font-secondary text-gray-600"></th>
                {xLabels.map((x) => (
                  <th
                    key={x}
                    className="border border-gray-200 p-2 text-xs font-secondary text-gray-600"
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yLabels.map((y) => (
                <tr key={y}>
                  <td className="border border-gray-200 p-2 text-xs font-secondary text-gray-600 font-medium">
                    {y}
                  </td>
                  {xLabels.map((x) => {
                    const value = getValue(x, y)
                    return (
                      <td
                        key={`${x}-${y}`}
                        className={`border border-gray-200 p-2 text-center text-xs font-secondary cursor-pointer hover:opacity-80 transition-opacity ${getColor(
                          value
                        )}`}
                        onClick={() =>
                          onDataPointClick?.({ x, y, value })
                        }
                        title={`${x} × ${y}: ${value}`}
                      >
                        {value > 0 ? value : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ChartContainer>
  )
}

