'use client'

import { useState } from 'react'
import type { DashboardData } from '@/types/dashboard'
import ExportConfigPanel from './ExportConfigPanel'

interface ExportButtonProps {
  readonly data: DashboardData
  readonly className?: string
}

export default function ExportButton({ data, className = '' }: Readonly<ExportButtonProps>) {
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  return (
    <>
      <div className={className}>
        <button
          onClick={() => setShowConfigPanel(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowConfigPanel(true)
            }
          }}
          aria-label="Abrir configurações de exportação"
          aria-expanded={showConfigPanel}
          className="w-full px-1.5 sm:px-2 md:px-2 py-1 sm:py-1.5 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center justify-center gap-0.5 sm:gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap min-w-0"
        >
          <svg
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="hidden sm:inline truncate">Exportar</span>
        </button>
      </div>

      <ExportConfigPanel
        data={data}
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
        onExport={() => {

        }}
      />
    </>
  )
}

