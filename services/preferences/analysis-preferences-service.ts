'use client'

const ANALYSIS_ENABLED_KEY = 'dashboard:analysis-enabled'

export const analysisPreferencesService = {
  /**
   * Verifica se as análises estão habilitadas
   * Por padrão, retorna false (desativado)
   */
  isAnalysisEnabled(): boolean {
    if (typeof window === 'undefined') return false
    
    const stored = localStorage.getItem(ANALYSIS_ENABLED_KEY)
    if (stored === null) {
      // Primeira vez: salva como desativado por padrão
      this.setAnalysisEnabled(false)
      return false
    }
    
    return stored === 'true'
  },

  /**
   * Define se as análises estão habilitadas
   */
  setAnalysisEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(ANALYSIS_ENABLED_KEY, String(enabled))
    
    // Dispara evento customizado para notificar outros componentes
    window.dispatchEvent(new CustomEvent('analysis-preference-changed', { detail: { enabled } }))
  },

  /**
   * Alterna o estado das análises
   */
  toggleAnalysis(): boolean {
    const newState = !this.isAnalysisEnabled()
    this.setAnalysisEnabled(newState)
    return newState
  },
}

