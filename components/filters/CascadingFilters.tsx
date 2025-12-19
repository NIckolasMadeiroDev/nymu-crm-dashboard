'use client'

import { useState, useEffect } from 'react'
import type { FilterConfig } from '@/types/charts'

interface CascadingFiltersProps {
  readonly filters: FilterConfig[]
  readonly values: Record<string, any>
  readonly onChange: (values: Record<string, any>) => void
}

export default function CascadingFilters({
  filters,
  values,
  onChange,
}: Readonly<CascadingFiltersProps>) {
  const [availableOptions, setAvailableOptions] = useState<Record<string, any[]>>({})

  useEffect(() => {
    const options: Record<string, any[]> = {}
    
    filters.forEach((filter) => {
      if (filter.dependentOn) {
        const parentValue = values[filter.dependentOn]
        if (parentValue) {
          options[filter.key] = filter.options?.filter((opt) => {
            return opt.value.includes(parentValue) || opt.value === parentValue
          }) || []
        } else {
          options[filter.key] = []
        }
      } else {
        options[filter.key] = filter.options || []
      }
    })

    setAvailableOptions(options)
  }, [filters, values])

  const handleChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value }
    
    filters.forEach((filter) => {
      if (filter.dependentOn === key) {
        newValues[filter.key] = ''
      }
    })

    onChange(newValues)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {filters.map((filter) => {
        const isDisabled = Boolean(filter.dependentOn && !values[filter.dependentOn])
        const options = availableOptions[filter.key] || filter.options || []

        return (
          <div key={filter.key}>
            <label className="block text-xs font-medium text-gray-700 font-secondary mb-1">
              {filter.label}
              {filter.dependentOn && (
                <span className="text-gray-400 text-xs ml-1">
                  (depende de {filters.find((f) => f.key === filter.dependentOn)?.label})
                </span>
              )}
            </label>
            <select
              value={values[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              disabled={isDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Selecione...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}

