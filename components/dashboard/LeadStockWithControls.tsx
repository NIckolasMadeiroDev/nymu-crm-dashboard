'use client'

import { useMemo } from 'react'
import ChartWithControls from './ChartWithControls'
import type { LeadStock } from '@/types/dashboard'
import type { ChartConfig } from '@/types/charts'

interface LeadStockWithControlsProps {
  readonly data: LeadStock
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function LeadStockWithControls({ data, dragHandleProps }: LeadStockWithControlsProps) {
  const chartConfig: ChartConfig = useMemo(() => {
    return {
      type: 'bar',
      title: 'Estoque de Leads',
      data: [
        { name: 'Lista de Contato', value: data.contactList },
        { name: 'Primeiro Contato', value: data.firstContact },
        { name: 'No Grupo', value: data.inGroup },
        { name: 'Pós-Meet', value: data.postMeet },
      ],
      xAxisKey: 'name',
      yAxisKey: 'value',
      height: 160,
    }
  }, [data])

  return (
    <ChartWithControls
      id="lead-stock-chart"
      title="Estoque de Leads"
      initialChartType="pie"
      chartConfig={chartConfig}
      availableChartTypes={['bar', 'column', 'pie', 'donut', 'treemap']}
      dragHandleProps={dragHandleProps}
    />
  )
}

