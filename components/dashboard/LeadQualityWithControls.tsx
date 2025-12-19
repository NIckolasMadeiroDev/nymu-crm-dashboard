'use client'

import { useState } from 'react'
import WidgetContainer from '@/components/widgets/WidgetContainer'
import LeadQualityComponent from './LeadQuality'
import type { LeadQuality } from '@/types/dashboard'
import { useAnalysisPreference } from '@/components/charts/hooks/useAnalysisPreference'
import { useChartMinimization } from '@/contexts/ChartMinimizationContext'

interface LeadQualityWithControlsProps {
  readonly data: LeadQuality[]
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function LeadQualityWithControls({
  data,
  dragHandleProps,
}: LeadQualityWithControlsProps) {
  const { isEnabled: isAnalysisEnabled } = useAnalysisPreference()
  const { isMinimized: isMinimizedContext, toggleMinimize } = useChartMinimization()
  const [useNewDesign, setUseNewDesign] = useState(true)
  const chartId = 'lead-quality-widget'
  const isMinimized = isMinimizedContext(chartId)

  const handleMinimize = () => {
    toggleMinimize(chartId)
  }

  const handleRestore = () => {
    toggleMinimize(chartId)
  }

  const toggleDesign = () => {
    setUseNewDesign((prev) => !prev)
  }

  return (
    <WidgetContainer
      id="lead-quality-widget"
      title="Qualidade dos Leads"
      isMinimized={isMinimized}
      onMinimize={handleMinimize}
      onRestore={handleRestore}
      analysisEnabled={isAnalysisEnabled}
      dragHandleProps={dragHandleProps}
      headerAction={
        <button
          onClick={toggleDesign}
          className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-gray-700 bg-blue-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-secondary"
          aria-label={useNewDesign ? 'Alternar para visual compacto' : 'Alternar para visual detalhado'}
          title={useNewDesign ? 'Alternar para visual compacto' : 'Alternar para visual detalhado'}
        >
          {useNewDesign ? 'Compacto' : 'Visual'}
        </button>
      }
    >
      <LeadQualityComponent data={data} useNewDesign={useNewDesign} />
    </WidgetContainer>
  )
}

