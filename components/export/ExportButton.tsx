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
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="w-4 h-4"
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
          Exportar
        </button>
      </div>

      <ExportConfigPanel
        data={data}
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
        onExport={() => {
          // Callback após exportação bem-sucedida
        }}
      />
    </>
  )
}

