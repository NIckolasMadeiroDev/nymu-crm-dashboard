'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { dashboardPreferencesService, type WidgetHeight } from '@/services/preferences/dashboard-preferences-service'

interface WidgetHeightContextType {
  widgetHeight: WidgetHeight
  widgetHeightPx: number
  setWidgetHeight: (height: WidgetHeight) => void
}

const WidgetHeightContext = createContext<WidgetHeightContextType | undefined>(undefined)

interface WidgetHeightProviderProps {
  readonly children: ReactNode
}

export function WidgetHeightProvider({ children }: Readonly<WidgetHeightProviderProps>) {
  const [widgetHeight, setWidgetHeightState] = useState<WidgetHeight>(() => 
    dashboardPreferencesService.getWidgetHeight()
  )
  const [widgetHeightPx, setWidgetHeightPx] = useState(() => 
    dashboardPreferencesService.getWidgetHeightPx()
  )

  const setWidgetHeight = (height: WidgetHeight) => {
    setWidgetHeightState(height)
    dashboardPreferencesService.saveWidgetHeight(height)
    const newHeightPx = dashboardPreferencesService.getWidgetHeightPx()
    setWidgetHeightPx(newHeightPx)
    window.dispatchEvent(new CustomEvent('widget-height-changed', { detail: { height, heightPx: newHeightPx } }))
  }

  useEffect(() => {
    const handleStorageChange = () => {
      setWidgetHeightState(dashboardPreferencesService.getWidgetHeight())
    }

    const handleHeightChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ height: WidgetHeight; heightPx?: number }>
      setWidgetHeightState(customEvent.detail.height)
      if (customEvent.detail.heightPx) {
        setWidgetHeightPx(customEvent.detail.heightPx)
      } else {
        setWidgetHeightPx(dashboardPreferencesService.getWidgetHeightPx())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widget-height-changed', handleHeightChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widget-height-changed', handleHeightChange)
    }
  }, [])

  return (
    <WidgetHeightContext.Provider value={{ widgetHeight, widgetHeightPx, setWidgetHeight }}>
      {children}
    </WidgetHeightContext.Provider>
  )
}

export function useWidgetHeight() {
  const context = useContext(WidgetHeightContext)
  if (context === undefined) {
    throw new Error('useWidgetHeight must be used within a WidgetHeightProvider')
  }
  return context
}

