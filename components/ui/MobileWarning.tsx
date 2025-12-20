'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-3 sm:p-4 md:p-6 z-50">
      <div className="bg-white dark:bg-gray-800 nymu-dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-2 sm:mx-4 border-2 border-yellow-400">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white nymu-dark:text-white mb-2 sm:mb-3 font-primary leading-tight">
              Acesso Mobile Não Disponível - Em Desenvolvimento
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 nymu-dark:text-gray-300 font-secondary leading-relaxed">
              O dashboard não está disponível em dispositivos móveis - Em Desenvolvimento. Por favor, acesse pelo computador para uma melhor experiência.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

