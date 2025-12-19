import type { ChartConfig, ChartDataPoint, TimeSeriesDataPoint, ScatterDataPoint, HeatmapDataPoint } from '@/types/charts'

export interface BaseChartProps {
  config: ChartConfig
  height?: number
  onDataPointClick?: (data: any) => void
}

export interface LineChartProps extends BaseChartProps {
  data: TimeSeriesDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  showGrid?: boolean
  showLegend?: boolean
}

export interface AreaChartProps extends BaseChartProps {
  data: TimeSeriesDataPoint[]
  series?: Array<{ key: string; name: string; color?: string; fill?: string }>
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
}

export interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  stacked?: boolean
  horizontal?: boolean
  showGrid?: boolean
  showLegend?: boolean
}

export interface PieChartProps extends BaseChartProps {
  data: ChartDataPoint[]
  donut?: boolean
  innerRadius?: number
  showLegend?: boolean
}

export interface ScatterChartProps extends BaseChartProps {
  data: ScatterDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  showGrid?: boolean
  showLegend?: boolean
}

export interface BubbleChartProps extends BaseChartProps {
  data: ScatterDataPoint[]
  series?: Array<{ key: string; name: string; color?: string }>
  height?: number
}

export interface HeatmapChartProps extends BaseChartProps {
  data: HeatmapDataPoint[]
  height?: number
}

export interface HistogramChartProps extends BaseChartProps {
  data: any[]
  bins?: number
  height?: number
}

export interface BoxplotChartProps extends BaseChartProps {
  data: Array<{
    name: string
    min: number
    q1: number
    median: number
    q3: number
    max: number
    mean?: number
  }>
  height?: number
}

export interface TreemapChartProps extends BaseChartProps {
  data: Array<{
    name: string
    value: number
    children?: any[]
  }>
  height?: number
}

export interface SunburstChartProps extends BaseChartProps {
  data: Array<{
    name: string
    value: number
    children?: any[]
  }>
  height?: number
}

export interface CorrelogramChartProps extends BaseChartProps {
  data: Array<Record<string, number>>
  metrics: string[]
  height?: number
}

export interface GaugeChartProps extends BaseChartProps {
  value: number
  min?: number
  max?: number
  thresholds?: Array<{ value: number; color: string; label: string }>
  format?: 'number' | 'currency' | 'percentage'
  height?: number
}

export interface BulletChartProps extends BaseChartProps {
  data: Array<{
    title: string
    value: number
    target: number
    ranges: Array<{ value: number; color: string }>
    format?: string
  }>
  height?: number
}

export interface MapChartProps extends BaseChartProps {
  data: Array<{
    lat: number
    lng: number
    value?: number
    label?: string
  }>
  type?: 'points' | 'heatmap' | 'choropleth'
  height?: number
}

