'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NymuLogo from '@/components/common/NymuLogo'
import LanguageSelector from '@/components/language/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { themeService } from '@/services/theme/theme-service'
import { logout } from '@/services/auth/auth-service'
import { toast } from 'react-hot-toast'

interface DashboardHeaderProps {
  readonly title?: string
  readonly subtitle?: string
}

export default function DashboardHeader({
  title,
  subtitle,
}: Readonly<DashboardHeaderProps>) {
  const { t } = useLanguage()
  const router = useRouter()
  const [logoVariant, setLogoVariant] = useState<'twocolor' | 'white'>('twocolor')

  const handleLogout = () => {
    logout()
    toast.success('Logout realizado com sucesso!')
    router.push('/login')
  }

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

    const handleStorageChange = () => {
      updateLogoVariant()
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('storage', handleStorageChange)

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF9D02] focus:ring-offset-1"
            aria-label="Sair"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
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

