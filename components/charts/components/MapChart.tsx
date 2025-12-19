'use client'

import dynamic from 'next/dynamic'
import ChartContainer from '../ChartContainer'
import type { MapChartProps } from '../types/chart-props'

const MapComponent = dynamic(() => import('../MapComponent'), { ssr: false })

export default function MapChart({ config, data, type = 'points', height = 300 }: Readonly<MapChartProps>) {
  const mapData = data
    .filter((point) => point.value !== undefined && point.value !== null)
    .map((point) => ({
      lat: point.lat,
      lng: point.lng,
      value: point.value ?? 0,
      name: point.label,
    }))

  return (
    <ChartContainer title={config.title} subtitle={config.subtitle}>
      <div style={{ height: `${height}px` }} className="w-full">
        <MapComponent data={mapData} type={type} />
      </div>
    </ChartContainer>
  )
}

