'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface ErrorMessageProps {
  readonly message: string
  readonly onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: Readonly<ErrorMessageProps>) {
  const { t } = useLanguage()
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <p className="text-red-800 font-secondary mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-primary"
        >
          {t.dashboard.retry}
        </button>
      )}
    </div>
  )
}

