'use client'

import { useState } from 'react'
import WidgetContainer from '@/components/widgets/WidgetContainer'
import ChartFactory from '@/components/charts/ChartFactory'
import { useAnalysisPreference } from '@/components/charts/hooks/useAnalysisPreference'
import { useChartMinimization } from '@/contexts/ChartMinimizationContext'
import { useChartAnalysis } from '@/components/charts/hooks/useChartAnalysis'
import type { ChartType } from '@/components/charts/ChartTypeSelector'
import type { ChartConfig } from '@/types/charts'

interface ChartWithControlsProps {
  readonly id: string
  readonly title: string
  readonly initialChartType: ChartType
  readonly chartConfig: ChartConfig
  readonly availableChartTypes?: ChartType[]
  readonly onChartTypeChange?: (type: ChartType) => void
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

const ALL_CHART_TYPES: ChartType[] = [
  'line',
  'area',
  'stackedArea',
  'bar',
  'column',
  'stackedBar',
  'pie',
  'donut',
  'scatter',
  'bubble',
  'heatmap',
  'histogram',
  'boxplot',
  'treemap',
  'sunburst',
  'correlogram',
  'gauge',
  'bullet',
  'map',
]

export default function ChartWithControls({
  id,
  title,
  initialChartType,
  chartConfig,
  availableChartTypes = ALL_CHART_TYPES,
  onChartTypeChange,
  dragHandleProps,
}: ChartWithControlsProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType)
  const { isEnabled: isAnalysisEnabled } = useAnalysisPreference()
  const { isMinimized: isMinimizedContext, toggleMinimize } = useChartMinimization()

  const isMinimized = isMinimizedContext(id)

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type)
    onChartTypeChange?.(type)
  }

  const currentConfig: ChartConfig = {
    ...chartConfig,
    type: chartType,
  }

  const analysis = useChartAnalysis(chartConfig.data || [])

  const handleMinimize = () => {
    toggleMinimize(id)
  }

  const handleRestore = () => {
    toggleMinimize(id)
  }

  return (
    <WidgetContainer
      id={id}
      title={title}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      availableChartTypes={availableChartTypes}
      isMinimized={isMinimized}
      onMinimize={handleMinimize}
      onRestore={handleRestore}
      analysisEnabled={isAnalysisEnabled}
      analysis={analysis}
      dragHandleProps={dragHandleProps}
    >
      <ChartFactory config={currentConfig} />
    </WidgetContainer>
  )
}

