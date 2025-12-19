'use client'

import { useState, useMemo } from 'react'
import ChartFactory from '@/components/charts/ChartFactory'
import KpiGrid from '@/components/kpi/KpiGrid'
import AdvancedTable from '@/components/tables/AdvancedTable'
import AdvancedFilters from '@/components/filters/AdvancedFilters'
import type {
  ChartConfig,
  KpiCard,
  TableConfig,
  FilterConfig,
} from '@/types/charts'

interface EnhancedDashboardProps {
  readonly charts?: ChartConfig[]
  readonly kpis?: KpiCard[]
  readonly tables?: TableConfig[]
  readonly filters?: FilterConfig[]
  readonly onChartClick?: (chartId: string, data: any) => void
  readonly onKpiClick?: (kpi: KpiCard) => void
  readonly onTableRowClick?: (row: Record<string, any>) => void
}

export default function EnhancedDashboard({
  charts = [],
  kpis = [],
  tables = [],
  filters = [],
  onChartClick,
  onKpiClick,
  onTableRowClick,
}: EnhancedDashboardProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const filteredCharts = useMemo(() => {
    return charts.map((chart) => {
      if (!filterValues || Object.keys(filterValues).length === 0) {
        return chart
      }
      return {
        ...chart,
        data: chart.data,
      }
    })
  }, [charts, filterValues])

  return (
    <div className="space-y-6">
      {filters.length > 0 && (
        <AdvancedFilters
          filters={filters}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
        />
      )}

      {kpis.length > 0 && (
        <KpiGrid
          kpis={kpis}
          columns={Math.min(kpis.length, 4) as 1 | 2 | 3 | 4}
          onKpiClick={onKpiClick}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCharts.map((chart, index) => {
          const chartKey = chart.title || `chart-${chart.type}-${index}`
          return (
            <ChartFactory
              key={chartKey}
              config={chart}
              onDataPointClick={(data) => onChartClick?.(chart.title || chartKey, data)}
            />
          )
        })}
      </div>

      {tables.map((table, index) => {
        const tableKey = `table-${table.columns?.[0]?.key || index}`
        return (
          <AdvancedTable
            key={tableKey}
            config={table}
            onRowClick={onTableRowClick}
            onExport={(format) => {
              console.log(`Exporting table ${tableKey} as ${format}`)
            }}
          />
        )
      })}
    </div>
  )
}

