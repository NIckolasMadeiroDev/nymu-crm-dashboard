import { pt } from './locales/pt'
import { es } from './locales/es'
import { en } from './locales/en'

export type Locale = 'pt' | 'es' | 'en'

export const locales = {
  pt,
  es,
  en,
} as const

export type Translations = typeof pt

export function getTranslations(locale: Locale): Translations {
  return locales[locale]
}

export function getNestedTranslation(
  translations: Translations,
  key: string
): string {
  const keys = key.split('.')
  let value: any = translations

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      return key // Retorna a chave se não encontrar
    }
  }

  return typeof value === 'string' ? value : key
}

