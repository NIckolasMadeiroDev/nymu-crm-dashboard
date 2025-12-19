'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapDataPoint {
  lat: number
  lng: number
  value: number
  name?: string
}

interface MapComponentProps {
  data: MapDataPoint[]
  type: 'points' | 'heatmap' | 'choropleth'
}

export default function MapComponent({ data, type }: Readonly<MapComponentProps>) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView([-14.235, -51.9253], 4)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map

    if (type === 'points') {
      data.forEach((point) => {
        L.marker([point.lat, point.lng])
          .addTo(map)
          .bindPopup(`${point.name || 'Ponto'}: ${point.value}`)
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [data, type])

  return <div ref={containerRef} className="w-full h-full rounded-lg" />
}

