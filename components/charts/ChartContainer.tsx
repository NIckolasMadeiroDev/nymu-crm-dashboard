'use client'

import { ReactNode } from 'react'
import { useThemeColors } from './hooks/useThemeColors'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  onDrillDown?: () => void
  onExport?: () => void
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  className = '',
  actions,
  onDrillDown,
  onExport,
}: Readonly<ChartContainerProps>) {
  const themeColors = useThemeColors()
  const hasActions = onDrillDown || onExport || actions

  return (
    <div 
      className={`h-full flex flex-col rounded-lg shadow-sm border ${hasActions ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'} ${className}`}
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.gridColor,
        color: themeColors.foreground,
        transition: 'none',
        transitionProperty: 'none',
        animation: 'none',
      }}
    >
      {hasActions && (
        <div className="mb-1 sm:mb-1.5 flex items-center justify-end gap-0.5 sm:gap-1 flex-shrink-0">
          {actions}
          {onDrillDown && (
            <button
              onClick={onDrillDown}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onDrillDown()
                }
              }}
              className="p-0.5 sm:p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Ver detalhes do gráfico"
              title="Ver detalhes"
              style={{ color: themeColors.foreground }}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onExport()
                }
              }}
              className="p-0.5 sm:p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Exportar gráfico"
              title="Exportar"
              style={{ color: themeColors.foreground }}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="relative flex-1 min-h-0 w-full" style={{ marginBottom: '4px' }}>{children}</div>
    </div>
  )
}

