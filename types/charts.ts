export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'column'
  | 'stackedBar'
  | 'stackedArea'
  | 'horizontalBar'
  | 'histogram'
  | 'boxplot'
  | 'pie'
  | 'donut'
  | 'treemap'
  | 'sunburst'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'correlogram'
  | 'gauge'
  | 'bullet'
  | 'map'

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface TimeSeriesDataPoint {
  date: string | Date
  value: number
  category?: string
  [key: string]: string | number | Date | undefined
}

export interface ScatterDataPoint {
  x: number
  y: number
  size?: number
  label?: string
  category?: string
}

export interface HeatmapDataPoint {
  x: string
  y: string
  value: number
}

export interface ChartConfig {
  type: ChartType
  title?: string
  subtitle?: string
  data: ChartDataPoint[] | TimeSeriesDataPoint[] | ScatterDataPoint[] | HeatmapDataPoint[] | any[]
  xAxisKey?: string
  yAxisKey?: string
  series?: ChartSeries[]
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  height?: number
  width?: number
  value?: number
  min?: number
  max?: number
  format?: 'number' | 'currency' | 'percentage'
  metrics?: string[]
  mapType?: 'points' | 'heatmap' | 'choropleth'
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface ChartSeries {
  key: string
  name: string
  type?: 'line' | 'bar' | 'area'
  color?: string
  strokeWidth?: number
  fill?: string
}

export interface KpiCard {
  id: string
  title: string
  value: number | string
  previousValue?: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  trend?: number[]
  format?: 'number' | 'currency' | 'percentage' | 'duration'
  icon?: string
  color?: string
}

export interface ConditionalFormatting {
  minValue?: number
  maxValue?: number
  targetValue?: number
  tolerance?: number
  minColor?: string
  maxColor?: string
  targetColor?: string
  minTextColor?: string
  maxTextColor?: string
  targetTextColor?: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage'
  render?: (value: any, row: any) => React.ReactNode
  conditionalFormatting?: ConditionalFormatting
}

export interface TableConfig {
  columns: TableColumn[]
  data: Record<string, any>[]
  pagination?: {
    pageSize: number
    currentPage?: number
  }
  sorting?: {
    column: string
    direction: 'asc' | 'desc'
  }
  filters?: Record<string, any>
  searchable?: boolean
  exportable?: boolean
}

export interface FilterConfig {
  type: 'dateRange' | 'select' | 'multiSelect' | 'numberRange' | 'text'
  key: string
  label: string
  options?: { value: string; label: string }[]
  defaultValue?: any
  dependentOn?: string
}

export interface WidgetConfig {
  id: string
  type: 'chart' | 'kpi' | 'table' | 'map'
  title: string
  config: ChartConfig | KpiCard | TableConfig
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  refreshInterval?: number
}

