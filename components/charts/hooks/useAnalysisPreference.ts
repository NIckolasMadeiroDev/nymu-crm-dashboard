'use client'

import { useState, useEffect } from 'react'
import { analysisPreferencesService } from '@/services/preferences/analysis-preferences-service'

export function useAnalysisPreference() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {

    setIsEnabled(analysisPreferencesService.isAnalysisEnabled())

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

