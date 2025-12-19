'use client'

import ChartContainer from '../ChartContainer'
import type { CorrelogramChartProps } from '../types/chart-props'
import { useCorrelationMatrix, getCorrelationColor } from '../hooks/useCorrelationMatrix'
import { useThemeColors } from '../hooks/useThemeColors'

export default function CorrelogramChart({
  config,
  data,
  metrics,
  height = 300,
}: Readonly<CorrelogramChartProps>) {
  const themeColors = useThemeColors()
  const correlationMatrix = useCorrelationMatrix(data, metrics)

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div style={{ height: `${height}px` }} className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-xs font-secondary" style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}></th>
              {metrics.map((metric) => (
                <th
                  key={metric}
                  className="border p-2 text-xs font-secondary"
                  style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}
                >
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric1, i) => (
              <tr key={metric1}>
                <td className="border p-2 text-xs font-secondary font-medium" style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}>
                  {metric1}
                </td>
                {metrics.map((metric2, j) => {
                  const value = correlationMatrix[i][j]
                  const correlationColor = getCorrelationColor(value, themeColors)
                  return (
                    <td
                      key={metric2}
                      className="border p-2 text-center text-xs font-secondary"
                      style={{
                        borderColor: themeColors.gridColor,
                        backgroundColor: correlationColor,
                        color: themeColors.background,
                      }}
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

