'use client'

import { useMemo } from 'react'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'

interface CorrelogramData {
  [key: string]: number
}

interface CorrelogramChartProps {
  config: ChartConfig
  data: CorrelogramData[]
  metrics: string[]
  height?: number
}

export default function CorrelogramChart({
  config,
  data,
  metrics,
  height = 300,
}: Readonly<CorrelogramChartProps>) {
  const correlationMatrix = useMemo(() => {
    const calculateCorrelation = (values1: number[], values2: number[]): number => {
      if (values1.length !== values2.length || values1.length === 0) return 0

      const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
      const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length

      const numerator = values1.reduce((sum, _, i) => {
        return sum + (values1[i] - mean1) * (values2[i] - mean2)
      }, 0)

      const denom1 = Math.sqrt(values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0))
      const denom2 = Math.sqrt(values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0))

      if (denom1 * denom2 === 0) return 0
      return numerator / (denom1 * denom2)
    }

    const getMetricValues = (metric: string): number[] => {
      return data.map((d) => d[metric]).filter((v) => !Number.isNaN(v))
    }

    const matrix: number[][] = []

    metrics.forEach((metric1) => {
      const row: number[] = []
      metrics.forEach((metric2) => {
        if (metric1 === metric2) {
          row.push(1)
        } else {
          const values1 = getMetricValues(metric1)
          const values2 = getMetricValues(metric2)
          const correlation = calculateCorrelation(values1, values2)
          row.push(correlation)
        }
      })
      matrix.push(row)
    })

    return matrix
  }, [data, metrics])

  const getColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-600'
    if (value >= 0.3) return 'bg-blue-500'
    if (value >= -0.3) return 'bg-gray-300'
    if (value >= -0.7) return 'bg-orange-500'
    return 'bg-red-600'
  }

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div style={{ height: `${height}px` }} className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-xs font-secondary text-gray-600"></th>
              {metrics.map((metric) => (
                <th
                  key={metric}
                  className="border border-gray-300 p-2 text-xs font-secondary text-gray-600"
                >
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric1, i) => (
              <tr key={metric1}>
                <td className="border border-gray-300 p-2 text-xs font-secondary font-medium text-gray-700">
                  {metric1}
                </td>
                {metrics.map((metric2, j) => {
                  const value = correlationMatrix[i][j]
                  return (
                    <td
                      key={metric2}
                      className={`border border-gray-300 p-2 text-center ${getColor(value)} text-white text-xs font-secondary`}
                      title={`Correlação entre ${metric1} e ${metric2}: ${value.toFixed(2)}`}
                    >
                      {value.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartContainer>
  )
}

