'use client'

import dynamic from 'next/dynamic'
import type { ChartConfig } from '@/types/charts'
import ChartContainer from './ChartContainer'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface MapDataPoint {
  lat: number
  lng: number
  value: number
  name?: string
}

interface MapChartProps {
  config: ChartConfig
  data: MapDataPoint[]
  type?: 'points' | 'heatmap' | 'choropleth'
  height?: number
}

export default function MapChart({ config, data, type = 'points', height = 300 }: Readonly<MapChartProps>) {
  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div style={{ height: `${height}px` }} className="w-full">
        <MapComponent data={data} type={type} />
      </div>
    </ChartContainer>
  )
}

