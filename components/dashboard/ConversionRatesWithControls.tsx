'use client'

import { useState } from 'react'
import WidgetContainer from '@/components/widgets/WidgetContainer'
import ConversionRatesComponent from './ConversionRates'
import type { ConversionRates } from '@/types/dashboard'
import { useAnalysisPreference } from '@/components/charts/hooks/useAnalysisPreference'
import { useChartMinimization } from '@/contexts/ChartMinimizationContext'

interface ConversionRatesWithControlsProps {
  readonly data: ConversionRates
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function ConversionRatesWithControls({
  data,
  dragHandleProps,
}: ConversionRatesWithControlsProps) {
  const { isEnabled: isAnalysisEnabled } = useAnalysisPreference()
  const { isMinimized: isMinimizedContext, toggleMinimize } = useChartMinimization()
  const [useVisualDesign, setUseVisualDesign] = useState(true)
  const chartId = 'conversion-rates-widget'
  const isMinimized = isMinimizedContext(chartId)

  const handleMinimize = () => {
    toggleMinimize(chartId)
  }

  const handleRestore = () => {
    toggleMinimize(chartId)
  }

  const toggleDesign = () => {
    setUseVisualDesign((prev) => !prev)
  }

  return (
    <WidgetContainer
      id="conversion-rates-widget"
      title="Taxas de Conversão"
      isMinimized={isMinimized}
      onMinimize={handleMinimize}
      onRestore={handleRestore}
      analysisEnabled={isAnalysisEnabled}
      dragHandleProps={dragHandleProps}
      headerAction={
        <button
          onClick={toggleDesign}
          className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-gray-700 bg-blue-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-secondary"
          aria-label={useVisualDesign ? 'Alternar para visual compacto' : 'Alternar para visual detalhado'}
          title={useVisualDesign ? 'Alternar para visual compacto' : 'Alternar para visual detalhado'}
        >
          {useVisualDesign ? 'Compacto' : 'Visual'}
        </button>
      }
    >
      <ConversionRatesComponent data={data} useVisualDesign={useVisualDesign} />
    </WidgetContainer>
  )
}

