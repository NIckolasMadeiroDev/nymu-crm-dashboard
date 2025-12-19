'use client'

import ChartContainer from '../ChartContainer'
import type { HeatmapChartProps } from '../types/chart-props'
import { useHeatmapData, getHeatmapColor, getHeatmapValue } from '../hooks/useHeatmapData'
import { useThemeColors } from '../hooks/useThemeColors'

export default function HeatmapChart({
  config,
  data,
  height = 300,
  onDataPointClick,
}: Readonly<HeatmapChartProps>) {
  const themeColors = useThemeColors()
  const { xLabels, yLabels, maxValue, minValue } = useHeatmapData(data)

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
                <th className="border p-2 text-xs font-secondary" style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}></th>
                {xLabels.map((x) => (
                  <th
                    key={x}
                    className="border p-2 text-xs font-secondary"
                    style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yLabels.map((y) => (
                <tr key={y}>
                  <td className="border p-2 text-xs font-secondary font-medium" style={{ borderColor: themeColors.gridColor, color: themeColors.foreground, opacity: 0.7 }}>
                    {y}
                  </td>
                  {xLabels.map((x) => {
                    const value = getHeatmapValue(data, x, y)
                    return (
                      <td
                        key={`${x}-${y}`}
                        className="border p-2 text-center text-xs font-secondary cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          borderColor: themeColors.gridColor,
                          backgroundColor: getHeatmapColor(value, minValue, maxValue, {
                            primary: themeColors.primary,
                            info: themeColors.info,
                          }),
                          color: value > (maxValue + minValue) / 2 ? themeColors.background : themeColors.foreground,
                        }}
                        onClick={() => onDataPointClick?.({ x, y, value })}
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

