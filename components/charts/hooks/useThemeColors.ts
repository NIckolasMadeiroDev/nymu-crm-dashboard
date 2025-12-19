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
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  chartColors: [
    '#3b82f6', // primary - blue
    '#10b981', // secondary - green
    '#f59e0b', // warning - amber
    '#ef4444', // error - red
    '#8b5cf6', // accent - purple
    '#ec4899', // pink
    '#06b6d4', // info - cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#14b8a6', // teal
  ],
  background: '#ffffff',
  foreground: '#171717',
  gridColor: '#e5e7eb',
  tooltipBackground: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#171717',
}

const DARK_THEME_COLORS: ThemeColors = {
  primary: '#60a5fa',
  secondary: '#34d399',
  accent: '#a78bfa',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  chartColors: [
    '#60a5fa', // primary - light blue
    '#34d399', // secondary - light green
    '#fbbf24', // warning - light amber
    '#f87171', // error - light red
    '#a78bfa', // accent - light purple
    '#f472b6', // light pink
    '#22d3ee', // info - light cyan
    '#a3e635', // light lime
    '#fb923c', // light orange
    '#2dd4bf', // light teal
  ],
  background: '#0f172a',
  foreground: '#f1f5f9',
  gridColor: '#334155',
  tooltipBackground: '#1e293b',
  tooltipBorder: '#334155',
  tooltipText: '#f1f5f9',
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
              success: customTheme.colors.secondary,
              warning: '#f59e0b',
              error: '#ef4444',
              info: '#06b6d4',
              chartColors: [
                customTheme.colors.primary,
                customTheme.colors.secondary,
                customTheme.colors.accent,
                '#f59e0b',
                '#ef4444',
                '#ec4899',
                '#06b6d4',
                '#84cc16',
                '#f97316',
                '#14b8a6',
              ],
              background: customTheme.colors.background,
              foreground: customTheme.colors.foreground,
              gridColor: '#e5e7eb',
              tooltipBackground: customTheme.colors.background,
              tooltipBorder: '#e5e7eb',
              tooltipText: customTheme.colors.foreground,
            })
            return
          }
        }
      }
      setCustomThemeColors(null)
    }

    updateTheme()

    // Listen for storage changes (when theme is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm-dashboard-theme' || e.key?.startsWith('crm-dashboard')) {
        updateTheme()
      }
    }

    globalThis.window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes (in case of same-window updates)
    const interval = setInterval(updateTheme, 1000)

    return () => {
      globalThis.window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (customThemeColors) {
    return customThemeColors
  }

  return theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
}

