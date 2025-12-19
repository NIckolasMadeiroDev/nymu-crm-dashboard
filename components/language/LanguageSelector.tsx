'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { Locale } from '@/i18n'

export default function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage()

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'pt', label: t.language.portuguese, flag: '🇧🇷' },
    { code: 'es', label: t.language.spanish, flag: '🇪🇸' },
    { code: 'en', label: t.language.english, flag: '🇺🇸' },
  ]

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8"
        aria-label={t.language.title}
        title={t.language.title}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}

