'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { LeadStock } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface LeadStockWithControlsProps {
  readonly data: LeadStock
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (category: string, label: string) => void
}

export default function LeadStockWithControls({ 
  data, 
  dragHandleProps,
  onDataPointClick,
}: LeadStockWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    // LeadStock usa números simples
    const contactListValue = data.contactList || 0
    const firstContactValue = data.firstContact || 0
    const inGroupValue = data.inGroup || 0
    const postMeetValue = data.postMeet || 0

    return {
      type: 'bar',
      title: 'Estoque de Leads',
      data: [
        { 
          name: 'Lista de Contato', 
          value: contactListValue,
          category: 'contactList',
          categoryLabel: 'Lista de Contato',
        },
        { 
          name: 'Primeiro Contato', 
          value: firstContactValue,
          category: 'firstContact',
          categoryLabel: 'Primeiro Contato',
        },
        { 
          name: 'No Grupo', 
          value: inGroupValue,
          category: 'inGroup',
          categoryLabel: 'No Grupo',
        },
        { 
          name: 'Pós-Meet', 
          value: postMeetValue,
          category: 'postMeet',
          categoryLabel: 'Pós-Meet',
        },
      ],
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 160,
    }
  }, [data])

  const handleDataPointClick = (clickData: any) => {
    if (onDataPointClick && clickData) {
      const category = clickData.category || clickData.name
      const label = clickData.categoryLabel || clickData.name || category
      onDataPointClick(category, label)
    }
  }

  return (
    <ChartWithControls
      id="lead-stock-chart"
      title="Estoque de Leads"
      initialChartType="pie"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'column', 'pie', 'donut', 'treemap']}
      dragHandleProps={dragHandleProps}
      onDataPointClick={onDataPointClick ? handleDataPointClick : undefined}
    />
  )
}

