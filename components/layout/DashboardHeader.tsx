'use client'

import { useEffect, useState } from 'react'
import NymuLogo from '@/components/common/NymuLogo'
import LanguageSelector from '@/components/language/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { themeService } from '@/services/theme/theme-service'

interface DashboardHeaderProps {
  readonly title?: string
  readonly subtitle?: string
}

export default function DashboardHeader({
  title,
  subtitle,
}: Readonly<DashboardHeaderProps>) {
  const { t } = useLanguage()
  const [logoVariant, setLogoVariant] = useState<'twocolor' | 'white'>('twocolor')
  
  useEffect(() => {
    const updateLogoVariant = () => {
      const theme = themeService.getTheme()
      if (theme === 'dark') {
        setLogoVariant('white')
      } else {
        setLogoVariant('twocolor')
      }
    }

    updateLogoVariant()

    // Listen for theme changes
    const handleStorageChange = () => {
      updateLogoVariant()
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('storage', handleStorageChange)
      // Also check periodically for same-window updates
      const interval = setInterval(updateLogoVariant, 1000)

      return () => {
        globalThis.window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [])
  
  const displayTitle = title || t.dashboard.title
  const displaySubtitle = subtitle || t.dashboard.subtitle
  
  return (
    <header className="mb-2 sm:mb-3" role="banner">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <div className="h-6 sm:h-8 flex items-center w-full sm:w-auto">
          <NymuLogo
            variant={logoVariant}
            type="logotype"
            width={144}
            height={36}
            priority
            className="focus:outline-none w-auto max-w-full h-auto"
            style={{ maxWidth: 'min(120px, 100%)' }}
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <LanguageSelector />
        </div>
      </div>
      <h1 className="text-base sm:text-lg md:text-xl font-bold font-primary text-gray-900 break-words">{displayTitle}</h1>
      {displaySubtitle && (
        <p className="text-xs sm:text-sm text-gray-600 font-secondary mt-0.5 sm:mt-1 break-words" role="doc-subtitle">
          {displaySubtitle}
        </p>
      )}
    </header>
  )
}

