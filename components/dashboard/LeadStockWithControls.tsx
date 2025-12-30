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
    console.log('[LeadStockWithControls] handleDataPointClick called with:', clickData)
    if (onDataPointClick && clickData) {
      // O clickData pode vir do PieChart (com name e value) ou BarChart (com category)
      let category = clickData.category
      const label = clickData.categoryLabel || clickData.name || category
      
      // Se não tem category, mapear pelo name
      if (!category && clickData.name) {
        const nameLower = clickData.name.toLowerCase()
        if (nameLower.includes('lista de contato') || nameLower.includes('lista')) {
          category = 'contactList'
        } else if (nameLower.includes('primeiro contato') || nameLower.includes('primeiro')) {
          category = 'firstContact'
        } else if (nameLower.includes('no grupo') || nameLower.includes('grupo')) {
          category = 'inGroup'
        } else if (nameLower.includes('pós-meet') || nameLower.includes('pos-meet') || nameLower.includes('pós meet') || nameLower.includes('pos meet')) {
          category = 'postMeet'
        } else {
          // Fallback: usar o name como category
          category = clickData.name
        }
      }
      
      // Garantir que category existe
      if (!category) {
        console.warn('[LeadStockWithControls] No category found in clickData:', clickData)
        return
      }
      
      console.log('[LeadStockWithControls] Calling onDataPointClick with:', category, label)
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


