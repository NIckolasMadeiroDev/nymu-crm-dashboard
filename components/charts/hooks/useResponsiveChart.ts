'use client'

import { useState, useEffect } from 'react'

export interface ResponsiveChartConfig {
  fontSize: string
  smallFontSize: string
  marginRight: number
  marginLeft: number
  marginBottom: number
  xAxisHeight: number
  yAxisWidth: number
  tickCount?: number
  xAxisAngle: number
}

export function useResponsiveChart(): ResponsiveChartConfig {
  const [config, setConfig] = useState<ResponsiveChartConfig>({
    fontSize: '10px',
    smallFontSize: '9px',
    marginRight: 10,
    marginLeft: -10,
    marginBottom: 5,
    xAxisHeight: 60,
    yAxisWidth: 50,
    xAxisAngle: -45,
  })

  useEffect(() => {
    const updateConfig = () => {
      const isSmall = window.innerWidth < 640
      setConfig({
        fontSize: isSmall ? '9px' : '10px',
        smallFontSize: isSmall ? '8px' : '9px',
        marginRight: isSmall ? 5 : 10,
        marginLeft: isSmall ? -5 : -10,
        marginBottom: isSmall ? 50 : 20, // Aumentar para acomodar labels de múltiplas linhas
        xAxisHeight: isSmall ? 60 : 80, // Aumentar altura para labels de múltiplas linhas
        yAxisWidth: isSmall ? 40 : 50,
        tickCount: isSmall ? 5 : undefined,
        xAxisAngle: -45,
      })
    }

    updateConfig()
    window.addEventListener('resize', updateConfig)
    return () => window.removeEventListener('resize', updateConfig)
  }, [])

  return config
}

