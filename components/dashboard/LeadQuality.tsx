'use client'

import { useState, useMemo } from 'react'
import type { LeadQuality } from '@/types/dashboard'
import { formatNumber } from '@/utils/format-currency'

interface LeadQualityProps {
  readonly data: LeadQuality[]
  readonly useNewDesign?: boolean
  readonly onRowClick?: (origin: string) => void
}

type SortColumn = 'origin' | 'totalLeads' | 'percentageOfTotal'
type SortDirection = 'asc' | 'desc' | null
type GroupFilter = 'all' | 'tags' | 'college' | 'source'

export default function LeadQualityComponent({ data, useNewDesign = true, onRowClick }: LeadQualityProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')

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

  const filteredData = useMemo(() => {
    if (groupFilter === 'all') {
      return data
    }

    return data.filter((item) => {
      const origin = item.origin.toLowerCase()
      if (groupFilter === 'tags') {
        return origin.startsWith('tag:')
      }
      if (groupFilter === 'college') {
        return origin.startsWith('faculdade:')
      }
      if (groupFilter === 'source') {
        return !origin.startsWith('tag:') && !origin.startsWith('faculdade:') && origin !== 'unknown'
      }
      return true
    })
  }, [data, groupFilter])

  const sortedData = useMemo(() => {
    let result = [...filteredData]

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0
        if (sortColumn === 'origin') {
          comparison = a.origin.localeCompare(b.origin)
        } else if (sortColumn === 'totalLeads') {
          comparison = a.totalLeads - b.totalLeads
        } else if (sortColumn === 'percentageOfTotal') {
          comparison = a.percentageOfTotal - b.percentageOfTotal
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [filteredData, sortColumn, sortDirection])

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

  const groupCounts = useMemo(() => {
    const tags = data.filter(d => d.origin.toLowerCase().startsWith('tag:')).length
    const colleges = data.filter(d => d.origin.toLowerCase().startsWith('faculdade:')).length
    const sources = data.filter(d => {
      const origin = d.origin.toLowerCase()
      return !origin.startsWith('tag:') && !origin.startsWith('faculdade:') && origin !== 'unknown'
    }).length

    return { tags, colleges, sources, total: data.length }
  }, [data])

  return (
    <div className="flex flex-col h-full">

      <div className="flex flex-wrap gap-2 mb-4 px-1">
        <button
          onClick={() => setGroupFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-secondary ${
            groupFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({groupCounts.total})
        </button>
        {groupCounts.tags > 0 && (
          <button
            onClick={() => setGroupFilter('tags')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-secondary ${
              groupFilter === 'tags'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tags ({groupCounts.tags})
          </button>
        )}
        {groupCounts.colleges > 0 && (
          <button
            onClick={() => setGroupFilter('college')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-secondary ${
              groupFilter === 'college'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Faculdades ({groupCounts.colleges})
          </button>
        )}
        {groupCounts.sources > 0 && (
          <button
            onClick={() => setGroupFilter('source')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-secondary ${
              groupFilter === 'source'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Origens ({groupCounts.sources})
          </button>
        )}
      </div>

      <div className="overflow-auto flex-1 min-h-0 w-full rounded-lg" style={{ maxHeight: '100%' }}>
        <div className="inline-block min-w-full align-middle shadow-sm">
          <table
          className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 nymu-dark:divide-gray-700 bg-white dark:bg-gray-800 nymu-dark:bg-gray-800 rounded-lg overflow-hidden ${
            useNewDesign ? '' : 'divide-y divide-gray-200 dark:divide-gray-700 nymu-dark:divide-gray-700'
          }`}
            role="table"
            aria-label="Tabela de qualidade dos leads por origem"
          >
          <thead className={useNewDesign ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 nymu-dark:from-gray-800 nymu-dark:to-gray-700' : 'bg-gray-50 dark:bg-gray-800 nymu-dark:bg-gray-800'}>
              <tr role="row">
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-white nymu-dark:text-white uppercase tracking-wider font-secondary transition-colors whitespace-nowrap ${
                  sortColumn === 'origin' ? 'bg-blue-50 dark:bg-blue-900/30 nymu-dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold whitespace-nowrap">Grupo/Categoria</span>
                  <button
                    onClick={() => handleSort('origin')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200 flex-shrink-0"
                    aria-label="Ordenar por grupo"
                    title="Clique para ordenar"
                  >
                    {getSortIcon('origin')}
                  </button>
                </div>
                </th>
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-white nymu-dark:text-white uppercase tracking-wider font-secondary transition-colors whitespace-nowrap ${
                  sortColumn === 'totalLeads' ? 'bg-blue-50 dark:bg-blue-900/30 nymu-dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold whitespace-nowrap">Total de Leads</span>
                  <button
                    onClick={() => handleSort('totalLeads')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200 flex-shrink-0"
                    aria-label="Ordenar por total de leads"
                    title="Clique para ordenar (maior para menor)"
                  >
                    {getSortIcon('totalLeads')}
                  </button>
                </div>
                </th>
                <th
                  role="columnheader"
                  scope="col"
                className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-white nymu-dark:text-white uppercase tracking-wider font-secondary transition-colors whitespace-nowrap ${
                  sortColumn === 'percentageOfTotal' ? 'bg-blue-50 dark:bg-blue-900/30 nymu-dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold whitespace-nowrap">% do Total</span>
                  <button
                    onClick={() => handleSort('percentageOfTotal')}
                    className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 group-hover:bg-gray-200 flex-shrink-0"
                    aria-label="Ordenar por percentual do total"
                    title="Clique para ordenar (maior para menor)"
                  >
                    {getSortIcon('percentageOfTotal')}
                  </button>
                </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 nymu-dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 nymu-dark:divide-gray-700">
            {sortedData.map((item, index) => {
                const rowKey = `lead-quality-${item.origin}`
                return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(item.origin)}
                  className={`transition-colors duration-150 cursor-pointer ${
                    useNewDesign
                      ? 'hover:bg-blue-50 dark:hover:bg-gray-700 nymu-dark:hover:bg-gray-700 hover:shadow-sm even:bg-gray-50/50 dark:even:bg-gray-700/50 nymu-dark:even:bg-gray-700/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 nymu-dark:hover:bg-gray-700'
                  }`}
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white nymu-dark:text-white font-secondary">
                        {item.origin}
                      </div>
                    </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white nymu-dark:text-white font-secondary">
                      {formatNumber(item.totalLeads)}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {useNewDesign ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white nymu-dark:text-white font-secondary">
                          {item.percentageOfTotal.toFixed(1)}%
                        </span>
                        <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentageOfTotal}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white nymu-dark:text-white font-secondary">
                        {item.percentageOfTotal.toFixed(1)}%
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
    </div>
  )
}

