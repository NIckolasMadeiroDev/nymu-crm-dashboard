'use client'

import { useState, useEffect } from 'react'
import { analysisPreferencesService } from '@/services/preferences/analysis-preferences-service'

/**
 * Hook para gerenciar a preferência de análises de dados
 * Por padrão, as análises vêm desativadas
 */
export function useAnalysisPreference() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Carrega o estado inicial
    setIsEnabled(analysisPreferencesService.isAnalysisEnabled())

    // Escuta mudanças na preferência
    const handlePreferenceChange = (event: CustomEvent<{ enabled: boolean }>) => {
      setIsEnabled(event.detail.enabled)
    }

    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('analysis-preference-changed', handlePreferenceChange as EventListener)

      return () => {
        globalThis.removeEventListener('analysis-preference-changed', handlePreferenceChange as EventListener)
      }
    }
  }, [])

  const toggle = () => {
    const newState = analysisPreferencesService.toggleAnalysis()
    setIsEnabled(newState)
    return newState
  }

  return {
    isEnabled,
    toggle,
    setEnabled: (enabled: boolean) => {
      analysisPreferencesService.setAnalysisEnabled(enabled)
      setIsEnabled(enabled)
    },
  }
}

