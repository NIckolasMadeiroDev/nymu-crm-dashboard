export type Theme = 'nymu-light' | 'nymu-dark' | 'light' | 'dark' | 'custom'

export interface CustomTheme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
  }
  createdAt: Date
  isDefault?: boolean
}

export interface DefaultThemeColors {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
}

const STORAGE_KEY = 'crm-dashboard-theme'
const CUSTOM_THEMES_KEY = 'crm-dashboard-custom-themes'
const CUSTOM_ALTERNATIVE_LIGHT_KEY = 'crm-dashboard-custom-alternative-light'
const CUSTOM_ALTERNATIVE_DARK_KEY = 'crm-dashboard-custom-alternative-dark'

// Temas Nymu (cores da marca - paleta oficial)
// Cor Primária: #FF9D02 (RGB: 251, 180, 28 | CMYK: C:0 M:45 Y:100 K:0)
// Gradiente: #FFB84C (RGB: 251, 180, 28 | CMYK: C:0 M:32 Y:98 K:0)
// Cor Secundária Cinza Escuro: #333333 (RGB: 51, 51, 51 | CMYK: C:69 M:63 Y:62 K:58)
// Cor Secundária Cinza Claro: #F7F7F7 (RGB: 247, 247, 247 | CMYK: C:67 M:60 Y:60 K:46)
const NYMU_LIGHT_THEME: DefaultThemeColors = {
  primary: '#FF9D02', // Cor primária amarela
  secondary: '#FFB84C', // Gradiente amarelo mais claro
  background: '#F7F7F7', // Cor secundária cinza claro
  foreground: '#333333', // Cor primária cinza escuro
  accent: '#FF9D02', // Cor primária amarela
}

const NYMU_DARK_THEME: DefaultThemeColors = {
  primary: '#FF9D02', // Cor primária amarela
  secondary: '#FFB84C', // Gradiente amarelo mais claro
  background: '#333333', // Cor primária cinza escuro
  foreground: '#F7F7F7', // Cor secundária cinza claro
  accent: '#FF9D02', // Cor primária amarela
}

// Temas alternativos (cores antigas azuis)
const ALTERNATIVE_LIGHT_THEME: DefaultThemeColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  background: '#ffffff',
  foreground: '#171717',
  accent: '#8b5cf6',
}

const ALTERNATIVE_DARK_THEME: DefaultThemeColors = {
  primary: '#60a5fa',
  secondary: '#34d399',
  background: '#0f172a',
  foreground: '#f1f5f9',
  accent: '#a78bfa',
}

class ThemeService {
  private currentTheme: Theme = 'nymu-light'
  private currentCustomThemeId: string | null = null
  private customThemes: CustomTheme[] = []
  private customAlternativeLight: DefaultThemeColors | null = null
  private customAlternativeDark: DefaultThemeColors | null = null

  constructor() {
    this.loadTheme()
    this.loadCustomThemes()
    this.loadCustomAlternativeThemes()
    this.applyTheme(this.currentTheme)
  }

  getNymuLightTheme(): DefaultThemeColors {
    return { ...NYMU_LIGHT_THEME }
  }

  getNymuDarkTheme(): DefaultThemeColors {
    return { ...NYMU_DARK_THEME }
  }

  getAlternativeLightTheme(): DefaultThemeColors {
    if (this.customAlternativeLight) {
      return { ...this.customAlternativeLight }
    }
    return { ...ALTERNATIVE_LIGHT_THEME }
  }

  getAlternativeDarkTheme(): DefaultThemeColors {
    if (this.customAlternativeDark) {
      return { ...this.customAlternativeDark }
    }
    return { ...ALTERNATIVE_DARK_THEME }
  }

  setCustomAlternativeLightTheme(colors: DefaultThemeColors): void {
    this.customAlternativeLight = { ...colors }
    this.saveCustomAlternativeThemes()
    if (this.currentTheme === 'light') {
      this.applyTheme('light')
    }
  }

  setCustomAlternativeDarkTheme(colors: DefaultThemeColors): void {
    this.customAlternativeDark = { ...colors }
    this.saveCustomAlternativeThemes()
    if (this.currentTheme === 'dark') {
      this.applyTheme('dark')
    }
  }

  resetAlternativeLightTheme(): void {
    this.customAlternativeLight = null
    this.saveCustomAlternativeThemes()
    if (this.currentTheme === 'light') {
      this.applyTheme('light')
    }
  }

  resetAlternativeDarkTheme(): void {
    this.customAlternativeDark = null
    this.saveCustomAlternativeThemes()
    if (this.currentTheme === 'dark') {
      this.applyTheme('dark')
    }
  }

  hasCustomAlternativeLight(): boolean {
    return this.customAlternativeLight !== null
  }

  hasCustomAlternativeDark(): boolean {
    return this.customAlternativeDark !== null
  }

  private loadTheme() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const storedCustomId = localStorage.getItem(`${STORAGE_KEY}-custom-id`)
      
      if (stored) {
        // Migração: se for 'light' ou 'dark' antigo, converte para 'nymu-light' ou 'nymu-dark'
        if (stored === 'light') {
          this.currentTheme = 'nymu-light'
        } else if (stored === 'dark') {
          this.currentTheme = 'nymu-dark'
        } else {
          this.currentTheme = stored as Theme
        }
        if (this.currentTheme === 'custom' && storedCustomId) {
          this.currentCustomThemeId = storedCustomId
        }
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        this.currentTheme = prefersDark ? 'nymu-dark' : 'nymu-light'
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  }

  private loadCustomThemes() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.customThemes = data.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }))
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error)
      this.customThemes = []
    }
  }

  private loadCustomAlternativeThemes() {
    if (typeof window === 'undefined') return

    try {
      const storedLight = localStorage.getItem(CUSTOM_ALTERNATIVE_LIGHT_KEY)
      if (storedLight) {
        this.customAlternativeLight = JSON.parse(storedLight)
      }

      const storedDark = localStorage.getItem(CUSTOM_ALTERNATIVE_DARK_KEY)
      if (storedDark) {
        this.customAlternativeDark = JSON.parse(storedDark)
      }
    } catch (error) {
      console.error('Failed to load custom alternative themes:', error)
      this.customAlternativeLight = null
      this.customAlternativeDark = null
    }
  }

  private saveTheme() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, this.currentTheme)
      if (this.currentTheme === 'custom' && this.currentCustomThemeId) {
        localStorage.setItem(`${STORAGE_KEY}-custom-id`, this.currentCustomThemeId)
      } else {
        localStorage.removeItem(`${STORAGE_KEY}-custom-id`)
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  private saveCustomThemes() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(this.customThemes))
    } catch (error) {
      console.error('Failed to save custom themes:', error)
    }
  }

  private saveCustomAlternativeThemes() {
    if (typeof window === 'undefined') return

    try {
      if (this.customAlternativeLight) {
        localStorage.setItem(
          CUSTOM_ALTERNATIVE_LIGHT_KEY,
          JSON.stringify(this.customAlternativeLight)
        )
      } else {
        localStorage.removeItem(CUSTOM_ALTERNATIVE_LIGHT_KEY)
      }

      if (this.customAlternativeDark) {
        localStorage.setItem(
          CUSTOM_ALTERNATIVE_DARK_KEY,
          JSON.stringify(this.customAlternativeDark)
        )
      } else {
        localStorage.removeItem(CUSTOM_ALTERNATIVE_DARK_KEY)
      }
    } catch (error) {
      console.error('Failed to save custom alternative themes:', error)
    }
  }

  getTheme(): Theme {
    return this.currentTheme
  }

  setTheme(theme: Theme) {
    this.currentTheme = theme
    if (theme !== 'custom') {
      this.currentCustomThemeId = null
    }
    this.applyTheme(theme)
    this.saveTheme()
  }

  getCustomThemes(): CustomTheme[] {
    return [...this.customThemes]
  }

  getCustomThemeById(id: string): CustomTheme | null {
    return this.customThemes.find((t) => t.id === id) || null
  }

  createCustomTheme(name: string, colors: CustomTheme['colors']): CustomTheme {
    const theme: CustomTheme = {
      id: `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      colors,
      createdAt: new Date(),
    }

    this.customThemes.push(theme)
    this.saveCustomThemes()
    return theme
  }

  updateCustomTheme(id: string, updates: Partial<CustomTheme>): CustomTheme | null {
    const index = this.customThemes.findIndex((t) => t.id === id)
    if (index === -1) return null

    this.customThemes[index] = {
      ...this.customThemes[index],
      ...updates,
      id: this.customThemes[index].id,
      createdAt: this.customThemes[index].createdAt,
    }
    this.saveCustomThemes()

    if (this.currentCustomThemeId === id && this.currentTheme === 'custom') {
      this.applyCustomThemeStyles(this.customThemes[index])
    }

    return this.customThemes[index]
  }

  deleteCustomTheme(id: string): boolean {
    const index = this.customThemes.findIndex((t) => t.id === id)
    if (index === -1) return false

    this.customThemes.splice(index, 1)
    this.saveCustomThemes()

    if (this.currentCustomThemeId === id) {
      this.setTheme('nymu-light')
      this.currentCustomThemeId = null
    }

    return true
  }

  applyCustomTheme(themeId: string) {
    const theme = this.customThemes.find((t) => t.id === themeId)
    if (!theme) return

    this.currentTheme = 'custom'
    this.currentCustomThemeId = themeId
    this.applyCustomThemeStyles(theme)
    this.saveTheme()
  }

  getCurrentCustomThemeId(): string | null {
    return this.currentCustomThemeId
  }

  private applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.remove('nymu-light', 'nymu-dark', 'light', 'dark', 'custom')

    if (theme === 'nymu-light') {
      this.applyDefaultThemeStyles(NYMU_LIGHT_THEME)
      root.classList.add('nymu-light')
    } else if (theme === 'nymu-dark') {
      this.applyDefaultThemeStyles(NYMU_DARK_THEME)
      root.classList.add('nymu-dark')
    } else if (theme === 'light') {
      const lightColors = this.customAlternativeLight || ALTERNATIVE_LIGHT_THEME
      this.applyDefaultThemeStyles(lightColors)
      root.classList.add('light')
    } else if (theme === 'dark') {
      const darkColors = this.customAlternativeDark || ALTERNATIVE_DARK_THEME
      this.applyDefaultThemeStyles(darkColors)
      root.classList.add('dark')
    } else if (theme === 'custom') {
      const customTheme = this.customThemes.find(
        (t) => t.id === this.currentCustomThemeId
      )
      if (customTheme) {
        this.applyCustomThemeStyles(customTheme)
      }
    }
  }

  private applyDefaultThemeStyles(colors: DefaultThemeColors) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-secondary', colors.secondary)
    root.style.setProperty('--theme-background', colors.background)
    root.style.setProperty('--theme-foreground', colors.foreground)
    root.style.setProperty('--theme-accent', colors.accent)
  }

  private applyCustomThemeStyles(theme: CustomTheme) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-foreground', theme.colors.foreground)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.classList.add('custom')
  }
}

export const themeService = new ThemeService()

