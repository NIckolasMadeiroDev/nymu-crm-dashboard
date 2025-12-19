'use client'

import {
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  PieChart,
  HeatmapChart,
  HistogramChart,
  BoxplotChart,
  TreemapChart,
  SunburstChart,
  BubbleChart,
  CorrelogramChart,
  GaugeChart,
  BulletChart,
  MapChart,
} from './components'
import type { ChartConfig, ChartDataPoint, TimeSeriesDataPoint, ScatterDataPoint, HeatmapDataPoint } from '@/types/charts'

interface ChartFactoryProps {
  config: ChartConfig
  onDataPointClick?: (data: any) => void
}

export default function ChartFactory({ config, onDataPointClick }: Readonly<ChartFactoryProps>) {
  switch (config.type) {
    case 'line':
      return (
        <LineChart
          config={config}
          data={config.data as TimeSeriesDataPoint[]}
          series={config.series}
          showGrid={config.showGrid}
          showLegend={config.showLegend}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'area':
    case 'stackedArea':
      return (
        <AreaChart
          config={config}
          data={config.data as TimeSeriesDataPoint[]}
          series={config.series}
          stacked={config.type === 'stackedArea'}
          showGrid={config.showGrid}
          showLegend={config.showLegend}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'bar':
    case 'column':
    case 'stackedBar':
      return (
        <BarChart
          config={config}
          data={config.data as ChartDataPoint[]}
          series={config.series}
          stacked={config.type === 'stackedBar'}
          horizontal={config.type === 'bar'}
          showGrid={config.showGrid}
          showLegend={config.showLegend}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'pie':
    case 'donut':
      return (
        <PieChart
          config={config}
          data={config.data as ChartDataPoint[]}
          donut={config.type === 'donut'}
          showLegend={config.showLegend}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'scatter':
      return (
        <ScatterChart
          config={config}
          data={config.data as ScatterDataPoint[]}
          series={config.series}
          showGrid={config.showGrid}
          showLegend={config.showLegend}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'bubble':
      return (
        <BubbleChart
          config={config}
          data={config.data as any[]}
          series={config.series}
          height={config.height}
        />
      )

    case 'correlogram':
      return (
        <CorrelogramChart
          config={config}
          data={config.data as any[]}
          metrics={config.metrics || []}
          height={config.height}
        />
      )

    case 'gauge':
      return (
        <GaugeChart
          config={config}
          value={config.value || 0}
          min={config.min}
          max={config.max}
          height={config.height}
          format={config.format as any}
        />
      )

    case 'bullet':
      return (
        <BulletChart
          config={config}
          data={config.data as any[]}
          height={config.height}
        />
      )

    case 'heatmap':
      return (
        <HeatmapChart
          config={config}
          data={config.data as HeatmapDataPoint[]}
          height={config.height}
          onDataPointClick={onDataPointClick}
        />
      )

    case 'histogram':
      return (
        <HistogramChart
          config={config}
          data={config.data as any[]}
          height={config.height}
        />
      )

    case 'boxplot':
      return (
        <BoxplotChart
          config={config}
          data={config.data as any[]}
          height={config.height}
        />
      )

    case 'treemap':
      return (
        <TreemapChart
          config={config}
          data={config.data as any[]}
          height={config.height}
        />
      )

    case 'sunburst':
      return (
        <SunburstChart
          config={config}
          data={config.data as any[]}
          height={config.height}
        />
      )

    case 'map':
      return (
        <MapChart
          config={config}
          data={config.data as any[]}
          type={config.mapType as any}
          height={config.height}
        />
      )

    default:
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 font-secondary">
            Tipo de gráfico não suportado: {config.type}
          </p>
        </div>
      )
  }
}

