'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Locale } from '@/i18n'
import { useWidgetHeight } from '@/contexts/WidgetHeightContext'
import type { ChartLayout } from '@/services/preferences/dashboard-preferences-service'
import { dashboardPreferencesService } from '@/services/preferences/dashboard-preferences-service'
import {
  themeService,
  type Theme,
  type CustomTheme,
  type DefaultThemeColors,
} from '@/services/theme/theme-service'
import { dataSourcePreferenceService } from '@/services/data/data-source-preference-service'
import LanguageSelector from '@/components/language/LanguageSelector'
import ColorPicker from './ColorPicker'

interface SettingsModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly chartLayout: ChartLayout
  readonly onChartLayoutChange: (layout: ChartLayout) => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  chartLayout,
  onChartLayoutChange,
}: Readonly<SettingsModalProps>) {
  const { locale, setLocale } = useLanguage()
  const { widgetHeight, setWidgetHeight } = useWidgetHeight()
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [currentCustomThemeId, setCurrentCustomThemeId] = useState<string | null>(null)
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
  const [showLightColors, setShowLightColors] = useState(false)
  const [showDarkColors, setShowDarkColors] = useState(false)
  const [lightColors, setLightColors] = useState<DefaultThemeColors>(themeService.getAlternativeLightTheme())
  const [darkColors, setDarkColors] = useState<DefaultThemeColors>(themeService.getAlternativeDarkTheme())
  const [useMockData, setUseMockData] = useState(dataSourcePreferenceService.isUsingMockData())

  useEffect(() => {
    if (isOpen) {
      const theme = themeService.getTheme()
      setCurrentTheme(theme)
      setCustomThemes(themeService.getCustomThemes())
      setLightColors(themeService.getAlternativeLightTheme())
      setDarkColors(themeService.getAlternativeDarkTheme())
      setUseMockData(dataSourcePreferenceService.isUsingMockData())

      if (theme === 'custom') {
        const customId = themeService.getCurrentCustomThemeId()
        setCurrentCustomThemeId(customId)
      }
    }
  }, [isOpen])

  const handleThemeChange = (value: string) => {
    if (value === 'nymu-light' || value === 'nymu-dark' || value === 'light' || value === 'dark') {
      themeService.setTheme(value as Theme)
      setCurrentTheme(value as Theme)
      setCurrentCustomThemeId(null)
    } else if (value.startsWith('custom-')) {
      const themeId = value.replace('custom-', '')
      themeService.applyCustomTheme(themeId)
      setCurrentTheme('custom')
      setCurrentCustomThemeId(themeId)
    }
  }

  const getSelectValue = () => {
    if (currentTheme === 'custom' && currentCustomThemeId) {
      return `custom-${currentCustomThemeId}`
    }
    return currentTheme
  }

  const handleLightColorChange = (key: keyof DefaultThemeColors, value: string) => {
    const newColors = { ...lightColors, [key]: value }
    setLightColors(newColors)
    themeService.setCustomAlternativeLightTheme(newColors)
  }

  const handleDarkColorChange = (key: keyof DefaultThemeColors, value: string) => {
    const newColors = { ...darkColors, [key]: value }
    setDarkColors(newColors)
    themeService.setCustomAlternativeDarkTheme(newColors)
  }

  const handleResetLightColors = () => {
    themeService.resetAlternativeLightTheme()
    setLightColors(themeService.getAlternativeLightTheme())
  }

  const handleResetDarkColors = () => {
    themeService.resetAlternativeDarkTheme()
    setDarkColors(themeService.getAlternativeDarkTheme())
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open={isOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 w-full max-w-full bg-transparent"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onCancel={onClose}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              id="settings-modal-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 dark:text-white"
            >
              Configurações
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              aria-label="Fechar configurações"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <LanguageSelector />
            </div>

            <div>
              <label
                htmlFor="theme-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tema
              </label>
              <select
                id="theme-select"
                value={getSelectValue()}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-label="Selecionar tema"
              >
                <option value="nymu-light">🌞 Nymu Claro</option>
                <option value="nymu-dark">🌙 Nymu Escuro</option>
                <option value="light">🌞 Claro Alternativo</option>
                <option value="dark">🌙 Escuro Alternativo</option>
                {customThemes
                  .filter((theme) => theme.name && theme.name.trim() !== '')
                  .map((theme) => (
                    <option key={`custom-${theme.id}`} value={`custom-${theme.id}`}>
                      🎨 {theme.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="height-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Altura dos Widgets
              </label>
              <select
                id="height-select"
                value={widgetHeight}
                onChange={(e) => {
                  const newHeight = e.target.value as 'normal' | 'large' | 'extraLarge'
                  setWidgetHeight(newHeight)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-label="Selecionar altura dos widgets"
              >
                <option value="normal">Altura Normal</option>
                <option value="large">Altura Grande</option>
                <option value="extraLarge">Altura Extra Grande</option>
              </select>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label
                    htmlFor="data-source-toggle"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Fonte de Dados
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {useMockData
                      ? 'Usando dados de demonstração (mock)'
                      : 'Usando dados reais da API Helena'}
                  </p>
                </div>
                <button
                  type="button"
                  id="data-source-toggle"
                  role="switch"
                  aria-checked={!useMockData}
                  aria-label={useMockData ? 'Alternar para dados reais' : 'Alternar para dados mock'}
                  onClick={() => {
                    const newValue = !useMockData
                    setUseMockData(newValue)
                    dataSourcePreferenceService.setDataSource(newValue ? 'mock' : 'real')
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Settings] Data source changed to:', newValue ? 'mock' : 'real')
                    }
                    window.location.reload()
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    !useMockData
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      !useMockData ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <button
                type="button"
                onClick={() => setShowLightColors(!showLightColors)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                aria-expanded={showLightColors}
              >
                <span>Personalizar Cores - Claro Alternativo</span>
                {showLightColors ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showLightColors && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Personalize as cores do tema Claro Alternativo
                    </span>
                    <button
                      type="button"
                      onClick={handleResetLightColors}
                      disabled={!themeService.hasCustomAlternativeLight()}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        themeService.hasCustomAlternativeLight()
                          ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      aria-label="Redefinir cores para padrão do tema claro"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Redefinir
                    </button>
                  </div>
                  <ColorPicker
                    label="Cor Primária"
                    value={lightColors.primary}
                    onChange={(color) => handleLightColorChange('primary', color)}
                    description="Cor principal usada em botões e elementos destacados"
                  />
                  <ColorPicker
                    label="Cor Secundária"
                    value={lightColors.secondary}
                    onChange={(color) => handleLightColorChange('secondary', color)}
                    description="Cor secundária usada em gradientes e elementos complementares"
                  />
                  <ColorPicker
                    label="Cor de Fundo"
                    value={lightColors.background}
                    onChange={(color) => handleLightColorChange('background', color)}
                    description="Cor de fundo principal da aplicação"
                  />
                  <ColorPicker
                    label="Cor de Texto"
                    value={lightColors.foreground}
                    onChange={(color) => handleLightColorChange('foreground', color)}
                    description="Cor do texto principal"
                  />
                  <ColorPicker
                    label="Cor de Destaque"
                    value={lightColors.accent}
                    onChange={(color) => handleLightColorChange('accent', color)}
                    description="Cor usada em elementos de destaque e acentos"
                  />
                </div>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <button
                type="button"
                onClick={() => setShowDarkColors(!showDarkColors)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                aria-expanded={showDarkColors}
              >
                <span>Personalizar Cores - Escuro Alternativo</span>
                {showDarkColors ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showDarkColors && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Personalize as cores do tema Escuro Alternativo
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDarkColors}
                      disabled={!themeService.hasCustomAlternativeDark()}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                        themeService.hasCustomAlternativeDark()
                          ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      aria-label="Redefinir cores para padrão do tema escuro"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Redefinir
                    </button>
                  </div>
                  <ColorPicker
                    label="Cor Primária"
                    value={darkColors.primary}
                    onChange={(color) => handleDarkColorChange('primary', color)}
                    description="Cor principal usada em botões e elementos destacados"
                  />
                  <ColorPicker
                    label="Cor Secundária"
                    value={darkColors.secondary}
                    onChange={(color) => handleDarkColorChange('secondary', color)}
                    description="Cor secundária usada em gradientes e elementos complementares"
                  />
                  <ColorPicker
                    label="Cor de Fundo"
                    value={darkColors.background}
                    onChange={(color) => handleDarkColorChange('background', color)}
                    description="Cor de fundo principal da aplicação"
                  />
                  <ColorPicker
                    label="Cor de Texto"
                    value={darkColors.foreground}
                    onChange={(color) => handleDarkColorChange('foreground', color)}
                    description="Cor do texto principal"
                  />
                  <ColorPicker
                    label="Cor de Destaque"
                    value={darkColors.accent}
                    onChange={(color) => handleDarkColorChange('accent', color)}
                    description="Cor usada em elementos de destaque e acentos"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="layout-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Layout dos Gráficos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    value: 'one',
                    label: '1 por linha',
                    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM4 21a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z',
                  },
                  {
                    value: 'two',
                    label: '2 por linha',
                    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
                  },
                  {
                    value: 'three',
                    label: '3 por linha',
                    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM10 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM16 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM10 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM16 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newLayout = option.value as ChartLayout
                      onChartLayoutChange(newLayout)
                      dashboardPreferencesService.saveChartLayout(newLayout)
                    }}
                    className={`flex flex-col items-center gap-2 px-3 py-3 border-2 rounded-lg transition-colors ${
                      chartLayout === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                    aria-label={`Layout ${option.label}`}
                    aria-pressed={chartLayout === option.value}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={option.icon}
                      />
                    </svg>
                    <span className="text-xs font-secondary">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

