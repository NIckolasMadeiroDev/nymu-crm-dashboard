'use client'

import { useState } from 'react'
import type { FilterConfig } from '@/types/charts'

interface AdvancedFiltersProps {
  readonly filters: FilterConfig[]
  readonly values: Record<string, any>
  readonly onChange: (values: Record<string, any>) => void
  readonly onReset?: () => void
}

export default function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
}: Readonly<AdvancedFiltersProps>) {
  const [localValues, setLocalValues] = useState<Record<string, any>>(values)

  const handleChange = (key: string, value: any) => {
    const newValues = { ...localValues, [key]: value }
    setLocalValues(newValues)
    onChange(newValues)
  }

  const handleReset = () => {
    const resetValues: Record<string, any> = {}
    filters.forEach((filter) => {
      resetValues[filter.key] = filter.defaultValue || ''
    })
    setLocalValues(resetValues)
    onChange(resetValues)
    onReset?.()
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = localValues[filter.key] || filter.defaultValue || ''

    switch (filter.type) {
      case 'dateRange':
        return (
          <div key={filter.key} className="flex gap-2">
            <input
              type="date"
              value={value.start || ''}
              onChange={(e) =>
                handleChange(filter.key, {
                  ...value,
                  start: e.target.value,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="self-center text-gray-500">até</span>
            <input
              type="date"
              value={value.end || ''}
              onChange={(e) =>
                handleChange(filter.key, {
                  ...value,
                  end: e.target.value,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )

      case 'select':
        return (
          <select
            key={filter.key}
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'multiSelect':
        return (
          <select
            key={filter.key}
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
              handleChange(filter.key, selected)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          >
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'numberRange':
        return (
          <div key={filter.key} className="flex gap-2">
            <input
              type="number"
              placeholder="Mínimo"
              value={value.min || ''}
              onChange={(e) =>
                handleChange(filter.key, {
                  ...value,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="self-center text-gray-500">até</span>
            <input
              type="number"
              placeholder="Máximo"
              value={value.max || ''}
              onChange={(e) =>
                handleChange(filter.key, {
                  ...value,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )

      case 'text':
        return (
          <input
            key={filter.key}
            type="text"
            placeholder={filter.label}
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 font-primary">Filtros</h3>
        {onReset && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-secondary"
          >
            Limpar filtros
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-xs font-medium text-gray-700 font-secondary mb-1">
              {filter.label}
            </label>
            {renderFilter(filter)}
          </div>
        ))}
      </div>
    </div>
  )
}

