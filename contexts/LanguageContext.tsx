'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { Locale, Translations } from '@/i18n'
import { getTranslations } from '@/i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  translate: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'nymu-dashboard-locale'
const DEFAULT_LOCALE: Locale = 'pt'

interface LanguageProviderProps {
  readonly children: ReactNode
}

export function LanguageProvider({ children }: Readonly<LanguageProviderProps>) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    // Carregar idioma salvo do localStorage
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (savedLocale && (savedLocale === 'pt' || savedLocale === 'es' || savedLocale === 'en')) {
      setLocale(savedLocale)
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    // Atualizar atributo lang do HTML
    if (typeof document !== 'undefined') {
      let langValue = 'en'
      if (newLocale === 'pt') {
        langValue = 'pt-BR'
      } else if (newLocale === 'es') {
        langValue = 'es'
      }
      document.documentElement.lang = langValue
    }
  }

  const t = getTranslations(locale)

  const translate = (key: string): string => {
    const keys = key.split('.')
    let value: any = t

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value]
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }

  // Atualizar lang do HTML quando o idioma mudar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      let langValue = 'en'
      if (locale === 'pt') {
        langValue = 'pt-BR'
      } else if (locale === 'es') {
        langValue = 'es'
      }
      document.documentElement.lang = langValue
    }
  }, [locale])

  const contextValue = useMemo(
    () => ({ locale, setLocale: handleSetLocale, t, translate }),
    [locale, t, translate]
  )

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

