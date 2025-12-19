'use client'

import { useMemo } from 'react'
import type { KpiCard } from '@/types/charts'
import { formatCurrency, formatNumber } from '@/utils/format-currency'

interface KpiCardProps {
  readonly kpi: KpiCard
  readonly className?: string
  readonly onClick?: () => void
}

export default function KpiCardComponent({ kpi, className = '', onClick }: Readonly<KpiCardProps>) {
  const formattedValue = useMemo(() => {
    switch (kpi.format) {
      case 'currency':
        return formatCurrency(typeof kpi.value === 'number' ? kpi.value : 0)
      case 'percentage':
        return `${typeof kpi.value === 'number' ? kpi.value.toFixed(1) : kpi.value}%`
      case 'number':
        return formatNumber(typeof kpi.value === 'number' ? kpi.value : 0)
      default:
        return kpi.value.toString()
    }
  }, [kpi.value, kpi.format])

  const changePercentage = useMemo(() => {
    if (kpi.change === undefined || kpi.previousValue === undefined) return null
    if (typeof kpi.previousValue === 'number' && kpi.previousValue === 0) return null
    return kpi.change
  }, [kpi.change, kpi.previousValue])

  let changeColor = 'text-gray-600'
  if (kpi.changeType === 'increase') {
    changeColor = 'text-green-600'
  } else if (kpi.changeType === 'decrease') {
    changeColor = 'text-red-600'
  }

  const trendDirection = useMemo(() => {
    if (!kpi.trend || kpi.trend.length < 2) return null
    const last = kpi.trend.at(-1)
    const previous = kpi.trend.at(-2)
    if (!last || !previous) return null
    if (last > previous) return 'up'
    if (last < previous) return 'down'
    return 'neutral'
  }, [kpi.trend])

  if (onClick) {
    return (
      <button
        className={`bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4 text-left w-full ${className} cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500`}
        onClick={onClick}
        aria-label={`KPI: ${kpi.title}, valor: ${formattedValue}`}
      >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">
            {kpi.title}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-primary">{formattedValue}</p>
        </div>
        {kpi.icon && (
          <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.color || 'bg-blue-100'}`}>
            <span className="text-lg sm:text-xl">{kpi.icon}</span>
          </div>
        )}
      </div>

      {(changePercentage !== null || trendDirection) && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
          {changePercentage !== null && (
            <div className={`flex items-center gap-1 ${changeColor}`}>
              {kpi.changeType === 'increase' && (
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              )}
              {kpi.changeType === 'decrease' && (
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              )}
              <span className="text-xs sm:text-sm font-medium font-secondary">
                {Math.abs(changePercentage).toFixed(1)}%
              </span>
            </div>
          )}
          {trendDirection && (
            <div className="text-xs text-gray-500 font-secondary">
              {trendDirection === 'up' ? '↑ Tendência de alta' : '↓ Tendência de baixa'}
            </div>
          )}
        </div>
      )}
      </button>
    )
  }

  return (
    <article
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4 ${className}`}
      aria-label={`KPI: ${kpi.title}, valor: ${formattedValue}`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 font-secondary mb-0.5 sm:mb-1">
            {kpi.title}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-primary">{formattedValue}</p>
        </div>
        {kpi.icon && (
          <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.color || 'bg-blue-100'}`}>
            <span className="text-lg sm:text-xl">{kpi.icon}</span>
          </div>
        )}
      </div>

      {(changePercentage !== null || trendDirection) && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
          {changePercentage !== null && (
            <div className={`flex items-center gap-1 ${changeColor}`}>
              {kpi.changeType === 'increase' && (
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              )}
              {kpi.changeType === 'decrease' && (
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              )}
              <span className="text-xs sm:text-sm font-medium font-secondary">
                {Math.abs(changePercentage).toFixed(1)}%
              </span>
            </div>
          )}
          {trendDirection && (
            <div className="text-xs text-gray-500 font-secondary">
              {trendDirection === 'up' ? '↑ Tendência de alta' : '↓ Tendência de baixa'}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

