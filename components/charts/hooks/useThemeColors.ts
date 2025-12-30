'use client'

import { useEffect, useState } from 'react'
import { themeService, type Theme } from '@/services/theme/theme-service'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  chartColors: string[]
  background: string
  foreground: string
  gridColor: string
  tooltipBackground: string
  tooltipBorder: string
  tooltipText: string
}

const LIGHT_THEME_COLORS: ThemeColors = {
  primary: '#1976D2', // Azul Material Design tradicional
  secondary: '#388E3C', // Verde Material Design
  accent: '#7B1FA2', // Roxo Material Design
  success: '#4CAF50', // Verde tradicional
  warning: '#FF9800', // Laranja tradicional
  error: '#F44336', // Vermelho tradicional
  info: '#2196F3', // Azul tradicional
  chartColors: [
    '#1976D2', // Azul primário
    '#388E3C', // Verde
    '#FF9800', // Laranja
    '#F44336', // Vermelho
    '#7B1FA2', // Roxo
    '#E91E63', // Rosa
    '#00BCD4', // Ciano
    '#8BC34A', // Verde lima
    '#FF5722', // Laranja vermelho
    '#0097A7', // Ciano profundo
  ],
  background: '#FFFFFF',
  foreground: '#212121',
  gridColor: '#E0E0E0',
  tooltipBackground: '#FFFFFF',
  tooltipBorder: '#BDBDBD',
  tooltipText: '#212121',
}

const DARK_THEME_COLORS: ThemeColors = {
  primary: '#64B5F6', // Azul claro Material Design
  secondary: '#81C784', // Verde claro Material Design
  accent: '#BA68C8', // Roxo claro Material Design
  success: '#66BB6A', // Verde claro tradicional
  warning: '#FFB74D', // Laranja claro tradicional
  error: '#EF5350', // Vermelho claro tradicional
  info: '#42A5F5', // Azul claro tradicional
  chartColors: [
    '#64B5F6', // Azul claro
    '#81C784', // Verde claro
    '#FFB74D', // Laranja claro
    '#EF5350', // Vermelho claro
    '#BA68C8', // Roxo claro
    '#F48FB1', // Rosa claro
    '#4DD0E1', // Ciano claro
    '#AED581', // Verde lima claro
    '#FF8A65', // Laranja vermelho claro
    '#4DB6AC', // Ciano profundo claro
  ],
  background: '#121212',
  foreground: '#FFFFFF',
  gridColor: '#2C2C2C',
  tooltipBackground: '#1E1E1E',
  tooltipBorder: '#424242',
  tooltipText: '#FFFFFF',
}

const NYMU_LIGHT_THEME_COLORS: ThemeColors = {
  primary: '#FF9D02', // Amarelo primário Nymu
  secondary: '#FFB84C', // Amarelo secundário Nymu
  accent: '#FF9D02', // Accent amarelo
  success: '#059669', // Verde esmeralda distinto
  warning: '#D97706', // Laranja saturado
  error: '#DC2626', // Vermelho vibrante
  info: '#0284C7', // Azul ciano profundo
  chartColors: [
    '#FF9D02', // Amarelo Nymu - primário
    '#059669', // Verde esmeralda - complementar
    '#D97706', // Laranja - quente
    '#DC2626', // Vermelho - alerta
    '#7C3AED', // Roxo - vibrante
    '#EC4899', // Rosa - suave
    '#0284C7', // Azul ciano - fresco
    '#16A34A', // Verde lima - energético
    '#EA580C', // Laranja vermelho - intenso
    '#0891B2', // Ciano profundo - calmo
  ],
  background: '#FAFAFA',
  foreground: '#1F2937',
  gridColor: '#E5E7EB',
  tooltipBackground: '#FFFFFF',
  tooltipBorder: '#D1D5DB',
  tooltipText: '#1F2937',
}

const NYMU_DARK_THEME_COLORS: ThemeColors = {
  primary: '#FFB84C', // Amarelo claro Nymu para dark
  secondary: '#FF9D02', // Amarelo primário Nymu
  accent: '#FFB84C', // Accent amarelo claro
  success: '#66BB6A', // Verde claro tradicional
  warning: '#FFB74D', // Laranja claro tradicional
  error: '#EF5350', // Vermelho claro tradicional
  info: '#42A5F5', // Azul claro tradicional
  chartColors: [
    '#FFB84C', // Amarelo claro Nymu - primário
    '#66BB6A', // Verde claro - complementar
    '#FFB74D', // Laranja claro - quente
    '#EF5350', // Vermelho claro - alerta
    '#BA68C8', // Roxo claro - vibrante
    '#F48FB1', // Rosa claro - suave
    '#4DD0E1', // Ciano claro - fresco
    '#AED581', // Verde lima claro - energético
    '#FF8A65', // Laranja vermelho claro - intenso
    '#4DB6AC', // Ciano profundo claro - calmo
  ],
  background: '#1E1E1E',
  foreground: '#E5E5E5',
  gridColor: '#3A3A3A',
  tooltipBackground: '#2C2C2C',
  tooltipBorder: '#424242',
  tooltipText: '#E5E5E5',
}

export function useThemeColors(): ThemeColors {
  const [theme, setTheme] = useState<Theme>('light')
  const [customThemeColors, setCustomThemeColors] = useState<ThemeColors | null>(null)

  useEffect(() => {
    const updateTheme = () => {
      const newTheme = themeService.getTheme()
      setTheme(newTheme)

      if (newTheme === 'custom') {
        const customId = themeService.getCurrentCustomThemeId()
        if (customId) {
          const customTheme = themeService.getCustomThemeById(customId)
          if (customTheme) {
            setCustomThemeColors({
              primary: customTheme.colors.primary,
              secondary: customTheme.colors.secondary,
              accent: customTheme.colors.accent,
              success: '#4CAF50', // Verde tradicional
              warning: '#FF9800', // Laranja tradicional
              error: '#F44336', // Vermelho tradicional
              info: '#2196F3', // Azul tradicional
              chartColors: [
                customTheme.colors.primary,
                customTheme.colors.secondary,
                customTheme.colors.accent,
                '#FF9800', // Laranja
                '#F44336', // Vermelho
                '#E91E63', // Rosa
                '#00BCD4', // Ciano
                '#8BC34A', // Verde lima
                '#FF5722', // Laranja vermelho
                '#0097A7', // Ciano profundo
              ],
              background: customTheme.colors.background,
              foreground: customTheme.colors.foreground,
              gridColor: '#E5E7EB',
              tooltipBackground: customTheme.colors.background === '#FFFFFF' || customTheme.colors.background === '#FAFAFA' ? '#FFFFFF' : '#1E293B',
              tooltipBorder: customTheme.colors.background === '#FFFFFF' || customTheme.colors.background === '#FAFAFA' ? '#D1D5DB' : '#475569',
              tooltipText: customTheme.colors.foreground,
            })
            return
          }
        }
      }
      setCustomThemeColors(null)
    }

    updateTheme()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm-dashboard-theme' || e.key?.startsWith('crm-dashboard')) {
        updateTheme()
      }
    }

    globalThis.window.addEventListener('storage', handleStorageChange)

    const interval = setInterval(updateTheme, 1000)

    return () => {
      globalThis.window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (customThemeColors) {
    return customThemeColors
  }

  switch (theme) {
    case 'nymu-light':
      return NYMU_LIGHT_THEME_COLORS
    case 'nymu-dark':
      return NYMU_DARK_THEME_COLORS
    case 'dark':
      return DARK_THEME_COLORS
    case 'light':
    default:
      return LIGHT_THEME_COLORS
  }
}

