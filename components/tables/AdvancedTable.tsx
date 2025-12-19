'use client'

import { useState, useMemo } from 'react'
import type { TableConfig, TableColumn } from '@/types/charts'
import { formatCurrency, formatNumber } from '@/utils/format-currency'
import { format } from 'date-fns'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdvancedTableProps {
  readonly config: TableConfig
  readonly onRowClick?: (row: Record<string, any>) => void
  readonly onExport?: (format: 'csv' | 'excel' | 'pdf') => void
}

interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
  priority: number
}

export default function AdvancedTable({
  config,
  onRowClick,
  onExport,
}: Readonly<AdvancedTableProps>) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(config.pagination?.currentPage || 1)
  const [multiSort, setMultiSort] = useState<SortConfig[]>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    config.filters || {}
  )
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(config.columns.map((col) => col.key))
  )

  const pageSize = config.pagination?.pageSize || 10

  const filteredAndSortedData = useMemo(() => {
    let result = [...config.data]

    if (config.searchable && searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        )
      }
    })

    // Ordenação multi-coluna
    if (multiSort.length > 0) {
      const sortedMultiSort = [...multiSort].sort((s1, s2) => s1.priority - s2.priority)
      result.sort((a, b) => {
        for (const sort of sortedMultiSort) {
          const column = config.columns.find((col) => col.key === sort.column)
          const aVal = a[sort.column]
          const bVal = b[sort.column]

          let comparison = 0
          if (column?.format === 'number' || column?.format === 'currency') {
            const numA = typeof aVal === 'number' ? aVal : Number.parseFloat(String(aVal)) || 0
            const numB = typeof bVal === 'number' ? bVal : Number.parseFloat(String(bVal)) || 0
            comparison = numA - numB
          } else {
            const strA = String(aVal).toLowerCase()
            const strB = String(bVal).toLowerCase()
            comparison = strA.localeCompare(strB)
          }

          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison
          }
        }
        return 0
      })
    }

    return result
  }, [config.data, config.columns, config.searchable, searchTerm, columnFilters, multiSort])

  const paginatedData = useMemo(() => {
    if (!config.pagination) return filteredAndSortedData
    const start = (currentPage - 1) * pageSize
    return filteredAndSortedData.slice(start, start + pageSize)
  }, [filteredAndSortedData, currentPage, pageSize, config.pagination])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  const handleSort = (columnKey: string, event: React.MouseEvent) => {
    const existingSort = multiSort.find((s) => s.column === columnKey)
    const isMultiKey = event.ctrlKey || event.metaKey

    if (isMultiKey) {
      // Adicionar/remover da ordenação multi-coluna
      if (existingSort) {
        if (existingSort.direction === 'asc') {
          setMultiSort(multiSort.map((s) => (s.column === columnKey ? { ...s, direction: 'desc' } : s)))
        } else {
          setMultiSort(multiSort.filter((s) => s.column !== columnKey))
        }
      } else {
        setMultiSort([...multiSort, { column: columnKey, direction: 'asc', priority: multiSort.length + 1 }])
      }
    } else {
      // Ordenação single (substitui todas)
      const newDirection = existingSort?.direction === 'asc' ? 'desc' : 'asc'
      setMultiSort([{ column: columnKey, direction: newDirection, priority: 1 }])
    }
  }

  const getCellStyle = (column: TableColumn, value: any): React.CSSProperties => {
    const style: React.CSSProperties = {}

    // Destaque condicional
    if (column.conditionalFormatting) {
      const format = column.conditionalFormatting
      if (format.minValue !== undefined && typeof value === 'number' && value < format.minValue) {
        style.backgroundColor = format.minColor || '#fee2e2'
        style.color = format.minTextColor || '#991b1b'
      } else if (format.maxValue !== undefined && typeof value === 'number' && value > format.maxValue) {
        style.backgroundColor = format.maxColor || '#dcfce7'
        style.color = format.maxTextColor || '#166534'
      } else if (format.targetValue !== undefined && typeof value === 'number') {
        const diff = Math.abs(value - format.targetValue)
        if (diff <= (format.tolerance || 0)) {
          style.backgroundColor = format.targetColor || '#fef3c7'
          style.color = format.targetTextColor || '#92400e'
        }
      }
    }

    return style
  }

  const formatCellValue = (value: any, column: TableColumn) => {
    if (column.render) {
      return column.render(value, {})
    }

    switch (column.format) {
      case 'currency':
        return formatCurrency(typeof value === 'number' ? value : 0)
      case 'number':
        return formatNumber(typeof value === 'number' ? value : 0)
      case 'percentage':
        return `${typeof value === 'number' ? value.toFixed(1) : value}%`
      case 'date':
        return value ? format(new Date(value), 'dd/MM/yyyy') : ''
      default:
        return value?.toString() || ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            {config.searchable && (
              <input
                type="text"
                placeholder={t.common.search || 'Buscar...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label={t.common.search || 'Buscar na tabela'}
                className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
          {config.exportable && onExport && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('csv')}
                aria-label="Exportar CSV"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                CSV
              </button>
              <button
                onClick={() => onExport('excel')}
                aria-label="Exportar Excel"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Excel
              </button>
              <button
                onClick={() => onExport('pdf')}
                aria-label="Exportar PDF"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Controle de colunas visíveis */}
        {config.columns.length > 5 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-700 font-secondary">
              {t.common.select || 'Colunas:'}
            </span>
            {config.columns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-1 text-xs font-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.has(column.key)}
                  onChange={(e) => {
                    const newVisible = new Set(visibleColumns)
                    if (e.target.checked) {
                      newVisible.add(column.key)
                    } else {
                      newVisible.delete(column.key)
                    }
                    setVisibleColumns(newVisible)
                  }}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600">{column.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Indicador de ordenação multi-coluna */}
        {multiSort.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-gray-600 font-secondary">
            <span>{t.common.select || 'Ordenado por:'}</span>
            {multiSort.map((sort, index) => {
              const column = config.columns.find((col) => col.key === sort.column)
              return (
                <span key={sort.column} className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {column?.label || sort.column} ({sort.direction === 'asc' ? '↑' : '↓'})
                  {index < multiSort.length - 1 && ' > '}
                </span>
              )
            })}
            <button
              onClick={() => setMultiSort([])}
              className="text-red-600 hover:text-red-700"
              aria-label={t.common.reset || 'Limpar ordenação'}
            >
              {t.common.reset || 'Limpar'}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200"
          role="table"
          aria-label={config.columns[0]?.label ? `Tabela de ${config.columns[0].label}` : 'Tabela de dados'}
        >
          <thead className="bg-gray-50">
            <tr role="row">
              {config.columns
                .filter((column) => visibleColumns.has(column.key))
                .map((column) => (
                <th
                  key={column.key}
                  role="columnheader"
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-secondary ${
                    (() => {
                      if (column.align === 'right') return 'text-right'
                      if (column.align === 'center') return 'text-center'
                      return ''
                    })()
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                  {column.sortable && (() => {
                    const sortConfig = multiSort.find((s) => s.column === column.key)
                    const sortIndex = sortConfig ? multiSort.findIndex((s) => s.column === column.key) : -1
                    let sortDirection: 'none' | 'ascending' | 'descending' = 'none'
                    if (sortConfig?.direction === 'asc') {
                      sortDirection = 'ascending'
                    } else if (sortConfig?.direction === 'desc') {
                      sortDirection = 'descending'
                    }
                    
                    return (
                      <div className="inline-flex items-center">
                        <button
                          onClick={(e) => handleSort(column.key, e)}
                          aria-label={`${t.filters.select || 'Ordenar por'} ${column.label}`}
                          title={`${t.filters.select || 'Clique para ordenar'} | ${t.filters.select || 'Ctrl+Clique para ordenação múltipla'}`}
                          className="hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          <svg
                            className={`w-4 h-4 ${sortConfig ? 'text-blue-600' : 'text-gray-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                          </svg>
                        </button>
                        {sortConfig && (
                          <span className="ml-1 text-xs" aria-label={`Ordenação ${sortDirection}, prioridade ${sortIndex + 1}`}>
                            {sortIndex + 1}
                          </span>
                        )}
                        <span className="sr-only" aria-sort={sortDirection} />
                      </div>
                    )
                  })()}
                  </div>
                  {column.filterable && (
                    <input
                      type="text"
                      placeholder={`Filtrar ${column.label}...`}
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => {
                        setColumnFilters({
                          ...columnFilters,
                          [column.key]: e.target.value,
                        })
                        setCurrentPage(1)
                      }}
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr role="row">
                <td
                  colSpan={config.columns.filter((col) => visibleColumns.has(col.key)).length}
                  className="px-4 py-8 text-center text-gray-500 font-secondary"
                >
                  {t.common.search || 'Nenhum dado encontrado'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowId = row.id || row.key || `${JSON.stringify(row).substring(0, 50)}`
                return (
                  <tr
                    key={rowId}
                    role="row"
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-label={`Linha de dados`}
                  >
                    {config.columns
                      .filter((column) => visibleColumns.has(column.key))
                      .map((column) => {
                        let alignClass = ''
                        if (column.align === 'right') {
                          alignClass = 'text-right'
                        } else if (column.align === 'center') {
                          alignClass = 'text-center'
                        }
                        
                        return (
                          <td
                            key={column.key}
                            className={`px-4 py-3 whitespace-nowrap text-sm font-secondary ${alignClass}`}
                            style={getCellStyle(column, row[column.key])}
                          >
                            {formatCellValue(row[column.key], column)}
                          </td>
                        )
                      })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {config.pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 font-secondary">
            Mostrando {((currentPage - 1) * pageSize) + 1} a{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de{' '}
            {filteredAndSortedData.length} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-secondary"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700 font-secondary">
              {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-secondary"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

