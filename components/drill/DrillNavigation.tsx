'use client'

import { useState, useEffect } from 'react'
import { drillService, type DrillContext } from '@/services/drill/drill-service'

interface DrillNavigationProps {
  readonly onContextChange: (context: DrillContext | null) => void
}

export default function DrillNavigation({ onContextChange }: DrillNavigationProps) {
  const [context, setContext] = useState<DrillContext | null>(null)

  useEffect(() => {
    setContext(drillService.getCurrentContext())
    onContextChange(drillService.getCurrentContext())
  }, [onContextChange])

  const handleDrillUp = () => {
    const newContext = drillService.drillUp()
    setContext(newContext)
    onContextChange(newContext)
  }

  const handleReset = () => {
    drillService.reset()
    setContext(null)
    onContextChange(null)
  }

  if (!context) return null

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-900 font-secondary">
            Navegação: {context.path.join(' → ')}
          </span>
          <span className="text-xs text-blue-700 font-secondary">
            (Nível {context.level})
          </span>
        </div>
        <div className="flex gap-2">
          {drillService.canDrillUp() && (
            <button
              onClick={handleDrillUp}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-secondary"
              aria-label="Voltar nível anterior"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-secondary"
            aria-label="Resetar navegação"
          >
            Resetar
          </button>
        </div>
      </div>
    </div>
  )
}

