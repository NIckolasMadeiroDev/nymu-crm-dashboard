'use client'

import { useState, useMemo } from 'react'
import type { LeadQuality } from '@/types/dashboard'

interface LeadQualityProps {
  readonly data: LeadQuality[]
  readonly useNewDesign?: boolean
}

type SortColumn = 'origin' | 'meetParticipationRate' | 'purchaseRate'
type SortDirection = 'asc' | 'desc' | null

export default function LeadQualityComponent({ data, useNewDesign = true }: LeadQualityProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedData = useMemo(() => {
    let result = [...data]

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0
        if (sortColumn === 'origin') {
          comparison = a.origin.localeCompare(b.origin)
        } else if (sortColumn === 'meetParticipationRate') {
          comparison = a.meetParticipationRate - b.meetParticipationRate
        } else if (sortColumn === 'purchaseRate') {
          comparison = a.purchaseRate - b.purchaseRate
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, sortColumn, sortDirection])

  const getSortIcon = (column: SortColumn) => {
    const isActive = sortColumn === column
    const baseClasses = "w-4 h-4 transition-all duration-200"
    
    if (!isActive) {
      return (
        <svg
          className={`${baseClasses} text-gray-400 group-hover:text-gray-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }
    if (sortDirection === 'asc') {
      return (
        <svg
          className={`${baseClasses} text-blue-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 15l7-7 7 7"
          />
        </svg>
      )
    }
    return (
      <svg
        className={`${baseClasses} text-blue-600`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    )
  }

  return (
    <div className="overflow-auto flex-1 min-h-0 w-full rounded-lg" style={{ maxHeight: '100%' }}>
      <div className="inline-block min-w-full align-middle shadow-sm">
          <table
          className={`min-w-full divide-y divide-gray-200 bg-white rounded-lg overflow-hidden ${
            useNewDesign ? '' : 'divide-y divide-gray-200'
          }`}
            role="table"
            aria-label="Tabela de qualidade dos leads por origem"
          >
          <thead className={useNewDesign ? 'bg-gradient-to-r from-gray-50 to-gray-100' : 'bg-gray-50'}>
              <tr role="row">
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider font-secondary transition-colors ${
                  sortColumn === 'origin' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold">Origem</span>
                  <button
                    onClick={() => handleSort('origin')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200"
                    aria-label="Ordenar por origem"
                    title="Clique para ordenar"
                  >
                    {getSortIcon('origin')}
                  </button>
                </div>
                </th>
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider font-secondary transition-colors ${
                  sortColumn === 'meetParticipationRate' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold">% Entraram no Meet</span>
                  <button
                    onClick={() => handleSort('meetParticipationRate')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200"
                    aria-label="Ordenar por percentual de entrada no meet"
                    title="Clique para ordenar (maior para menor)"
                  >
                    {getSortIcon('meetParticipationRate')}
                  </button>
                </div>
                </th>
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider font-secondary transition-colors ${
                  sortColumn === 'purchaseRate' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold">% Compraram</span>
                  <button
                    onClick={() => handleSort('purchaseRate')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200"
                    aria-label="Ordenar por percentual de compra"
                    title="Clique para ordenar (maior para menor)"
                  >
                    {getSortIcon('purchaseRate')}
                  </button>
                </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => {
                const rowKey = `lead-quality-${item.origin}`
                return (
                <tr
                  key={rowKey}
                  className={`transition-colors duration-150 ${
                    useNewDesign
                      ? 'hover:bg-blue-50 hover:shadow-sm even:bg-gray-50/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm sm:text-base font-medium text-gray-900 font-secondary">
                        {item.origin}
                      </div>
                    </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {useNewDesign ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 font-secondary">
                          {item.meetParticipationRate.toFixed(0)}%
                        </span>
                        <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.meetParticipationRate}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm sm:text-base font-medium text-gray-900 font-secondary">
                        {item.meetParticipationRate.toFixed(0)}%
                      </div>
                    )}
                    </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {useNewDesign ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 font-secondary">
                          {item.purchaseRate.toFixed(0)}%
                        </span>
                        <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.purchaseRate}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm sm:text-base font-medium text-gray-900 font-secondary">
                        {item.purchaseRate.toFixed(0)}%
                      </div>
                    )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
    </div>
  )
}

