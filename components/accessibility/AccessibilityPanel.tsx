'use client'

import { useState, useEffect } from 'react'

interface AccessibilitySettings {
  fontSize: number
  highContrast: boolean
  letterSpacing: boolean
  lineHeight: boolean
}

const STORAGE_KEY = 'crm-dashboard-accessibility'

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  letterSpacing: false,
  lineHeight: false,
}

const loadSettingsFromStorage = (): AccessibilitySettings => {
  if (globalThis.window === undefined) {
    return defaultSettings
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return defaultSettings
  }

  try {
    const parsed = JSON.parse(stored)
    return {
      fontSize: parsed.fontSize ?? defaultSettings.fontSize,
      highContrast: parsed.highContrast ?? defaultSettings.highContrast,
      letterSpacing: parsed.letterSpacing ?? defaultSettings.letterSpacing,
      lineHeight: parsed.lineHeight ?? defaultSettings.lineHeight,
    }
  } catch {
    return defaultSettings
  }
}

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettingsFromStorage)

  const applySettings = (newSettings: AccessibilitySettings) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}`)

    if (newSettings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (newSettings.letterSpacing) {
      root.dataset.accessibilityLetterSpacing = 'true'
    } else {
      delete root.dataset.accessibilityLetterSpacing
    }

    if (newSettings.lineHeight) {
      root.dataset.accessibilityLineHeight = 'true'
    } else {
      delete root.dataset.accessibilityLineHeight
    }
  }

  useEffect(() => {
    applySettings(settings)
  }, [settings])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    applySettings(newSettings)

    if (globalThis.window !== undefined) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    applySettings(defaultSettings)
    if (globalThis.window !== undefined) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group touch-manipulation hover:bg-blue-700"
        aria-label="Acessibilidade"
        aria-expanded={isOpen}
        style={{ fontSize: 'inherit' }}
      >
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-50 w-[calc(100vw-2rem)] max-w-80 sm:max-w-96 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 sm:p-6 transform transition-all duration-300 ease-out"
            style={{
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 font-primary flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Acessibilidade
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Fechar"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 font-secondary">
                    Tamanho da fonte
                  </span>
                  <span className="text-xs text-gray-500 font-secondary">
                    {settings.fontSize}%
                  </span>
                </div>
                <fieldset className="flex items-center gap-2 border-0 p-0 m-0">
                  <legend className="sr-only">Controles de tamanho da fonte</legend>
                  <button
                    onClick={() =>
                      updateSetting('fontSize', Math.max(75, settings.fontSize - 10))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        updateSetting('fontSize', Math.max(75, settings.fontSize - 10))
                      }
                    }}
                    className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Diminuir tamanho da fonte"
                  >
                    <svg
                      className="w-4 h-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{
                        width: `${((settings.fontSize - 75) / (150 - 75)) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() =>
                      updateSetting('fontSize', Math.min(150, settings.fontSize + 10))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        updateSetting('fontSize', Math.min(150, settings.fontSize + 10))
                      }
                    }}
                    className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Aumentar tamanho da fonte"
                  >
                    <svg
                      className="w-4 h-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </fieldset>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors" htmlFor="high-contrast-checkbox" aria-label="Alto contraste">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 font-secondary">
                      Alto contraste
                    </span>
                  </div>
                  <input
                    id="high-contrast-checkbox"
                    type="checkbox"
                    checked={Boolean(settings.highContrast)}
                    onChange={(e) => updateSetting('highContrast', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 font-secondary">
                      Espaçamento entre letras
                    </span>
                  </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.letterSpacing)}
                      onChange={(e) => updateSetting('letterSpacing', e.target.checked)}
                      aria-label="Aumentar espaçamento entre letras"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 font-secondary">
                      Espaçamento entre linhas
                    </span>
                  </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.lineHeight)}
                      onChange={(e) => updateSetting('lineHeight', e.target.checked)}
                      aria-label="Aumentar espaçamento entre linhas"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                </label>
              </div>

              <button
                onClick={resetSettings}
                aria-label="Redefinir todas as configurações de acessibilidade"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 font-secondary hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Redefinir configurações
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

