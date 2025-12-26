'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export type ChartType =
  | 'line'
  | 'area'
  | 'stackedArea'
  | 'bar'
  | 'column'
  | 'stackedBar'
  | 'horizontalBar'
  | 'histogram'
  | 'boxplot'
  | 'pie'
  | 'donut'
  | 'treemap'
  | 'sunburst'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'correlogram'
  | 'gauge'
  | 'bullet'
  | 'map'

interface ChartTypeSelectorProps {
  currentType: ChartType
  onTypeChange: (type: ChartType) => void
  availableTypes?: ChartType[]
}

const SUPPORTED_CHART_TYPES: ChartType[] = [
  'line',
  'area',
  'stackedArea',
  'bar',
  'column',
  'stackedBar',
  'pie',
  'donut',
  'scatter',
  'bubble',
  'heatmap',
  'histogram',
  'boxplot',
  'treemap',
  'sunburst',
  'correlogram',
  'gauge',
  'bullet',
  'map',
]

const MAX_VISIBLE_ITEMS = 8
const ITEM_HEIGHT = 36
const HEADER_HEIGHT = 48
const CATEGORY_HEADER_HEIGHT = 24
const SEARCH_HEIGHT = 44

export default function ChartTypeSelector({
  currentType,
  onTypeChange,
  availableTypes,
}: Readonly<ChartTypeSelectorProps>) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, position: 'bottom' as 'bottom' | 'top' })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getChartTypeInfo = useCallback((type: ChartType) => {
    const typeKey = type as keyof typeof t.charts.types
    
    let categoryKey: 'quantitative' | 'proportion' | 'relation' | 'status' | 'geographic'
    if (['pie', 'donut', 'treemap', 'sunburst'].includes(type)) {
      categoryKey = 'proportion'
    } else if (['scatter', 'bubble', 'heatmap', 'correlogram'].includes(type)) {
      categoryKey = 'relation'
    } else if (['gauge', 'bullet'].includes(type)) {
      categoryKey = 'status'
    } else if (type === 'map') {
      categoryKey = 'geographic'
    } else {
      categoryKey = 'quantitative'
    }
    
    return {
      label: t.charts.types[typeKey] || type,
      category: t.charts.categories[categoryKey] || categoryKey,
    }
  }, [t])

  const getSupportedTypes = (types: ChartType[]): ChartType[] => {
    return types.filter((type) => SUPPORTED_CHART_TYPES.includes(type))
  }

  const allAvailableTypes = availableTypes
    ? getSupportedTypes(availableTypes)
    : SUPPORTED_CHART_TYPES

  const types = allAvailableTypes.filter((type) => SUPPORTED_CHART_TYPES.includes(type))

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return types
    
    const query = searchQuery.toLowerCase().trim()
    return types.filter((type) => {
      const info = getChartTypeInfo(type)
      return (
        info.label.toLowerCase().includes(query) ||
        info.category.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      )
    })
  }, [types, searchQuery, getChartTypeInfo])

  const groupedTypes = useMemo(() => {
    return filteredTypes.reduce((acc, type) => {
      const chartTypeInfo = getChartTypeInfo(type)
      const category = chartTypeInfo.category
      if (!acc[category]) acc[category] = []
      acc[category].push(type)
      return acc
    }, {} as Record<string, ChartType[]>)
  }, [filteredTypes, getChartTypeInfo])

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top

    const estimatedHeight = Math.min(
      Object.keys(groupedTypes).length * CATEGORY_HEADER_HEIGHT +
        filteredTypes.length * ITEM_HEIGHT +
        SEARCH_HEIGHT +
        16,
      400
    )

    const dropdownWidth = 320
    let left = buttonRect.left
    
    if (left + dropdownWidth > viewportWidth - 8) {
      left = viewportWidth - dropdownWidth - 8
    }
    if (left < 8) {
      left = 8
    }
    
    let top = 0
    let position: 'bottom' | 'top' = 'bottom' // default bottom; will be set below

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      position = 'top'
      top = buttonRect.top - estimatedHeight - 8
      if (top < 8) {
        top = 8
      }
    } else {
      top = buttonRect.bottom + 8
      if (top + estimatedHeight > viewportHeight - 8) {
        top = viewportHeight - estimatedHeight - 8
      }
    }

    setDropdownPosition({ top, left, position })
  }, [groupedTypes, filteredTypes.length])

  useEffect(() => {
    if (isOpen) {
      calculatePosition()
      const handleResize = () => calculatePosition()
      const handleScroll = () => calculatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isOpen, calculatePosition])

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedButton = dropdownRef.current.querySelector(
        `button[data-chart-type="${currentType}"]`
      ) as HTMLElement
      
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [isOpen, currentType])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleTypeSelect = (type: ChartType) => {
    onTypeChange(type)
    setIsOpen(false)
    setSearchQuery('')
  }

  const totalItems = filteredTypes.length
  const hasManyItems = totalItems > MAX_VISIBLE_ITEMS
  const maxHeight = hasManyItems
    ? `${MAX_VISIBLE_ITEMS * ITEM_HEIGHT + HEADER_HEIGHT + SEARCH_HEIGHT + 32}px`
    : 'auto'

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setSearchQuery('')
          }
        }}
        className="px-2 sm:px-2.5 md:px-2.5 py-1 sm:py-1.5 md:py-1.5 text-[10px] sm:text-xs md:text-xs lg:text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-secondary flex items-center gap-1 sm:gap-1.5 md:gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
        aria-label="Trocar tipo de gráfico"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Clique para trocar o tipo de gráfico"
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
          />
        </svg>
        <span className="text-white truncate max-w-[40px] sm:max-w-[60px] md:max-w-[100px] lg:max-w-[120px] xl:max-w-none">
          {getChartTypeInfo(currentType).label || t.charts.selectType}
        </span>
        <svg 
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }} 
            aria-hidden="true" 
          />
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[240px] max-w-[320px]"
            style={{ 
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              maxHeight: hasManyItems ? maxHeight : 'none',
              overflowY: hasManyItems ? 'auto' : 'visible',
            }}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.common.search || 'Buscar...'}
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-secondary"
                  autoFocus
                  aria-label="Buscar tipo de gráfico"
                />
                <svg 
                  className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    aria-label="Limpar busca"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="p-2">
              {Object.keys(groupedTypes).length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center font-secondary">
                  {t.common.search ? `Nenhum resultado encontrado para "${searchQuery}"` : 'Nenhum tipo disponível'}
                </div>
              ) : (
                Object.entries(groupedTypes).map(([category, categoryTypes]) => (
                  <div key={category} className="mb-1 last:mb-0">
                    <div className="text-xs font-semibold text-gray-500 font-secondary px-2 py-1.5 sticky top-[52px] bg-gray-50 rounded">
                      {category}
                    </div>
                    {categoryTypes.map((type) => {
                      const chartTypeInfo = getChartTypeInfo(type)
                      const isSelected = currentType === type
                      
                      return (
                        <button
                          key={type}
                          data-chart-type={type}
                          onClick={() => handleTypeSelect(type)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 font-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            isSelected 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{chartTypeInfo.label}</span>
                            {isSelected && (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

