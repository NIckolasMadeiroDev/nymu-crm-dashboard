'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
  readonly startDate?: Date
  readonly endDate?: Date
  readonly onChange: (range: { start?: Date; end?: Date }) => void
  readonly className?: string
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = '',
}: Readonly<DateRangePickerProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to?: Date }>({
    from: startDate,
    to: endDate,
  })

  const handleSelect = (range: { from: Date | undefined; to?: Date } | undefined) => {
    if (range) {
      setSelectedRange(range)
      if (range.from && range.to) {
        onChange({ start: range.from, end: range.to })
        setIsOpen(false)
      }
    }
  }

  let displayText: string
  if (selectedRange.from && selectedRange.to) {
    displayText = `${format(selectedRange.from, 'dd/MM/yyyy')} - ${format(selectedRange.to, 'dd/MM/yyyy')}`
  } else if (selectedRange.from) {
    displayText = format(selectedRange.from, 'dd/MM/yyyy')
  } else {
    displayText = 'Selecione um período'
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
        aria-label="Selecionar período"
        aria-expanded={isOpen}
      >
        <span>{displayText}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleSelect}
              locale={ptBR}
              numberOfMonths={2}
              className="rdp"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const today = new Date()
                  const lastWeek = new Date(today)
                  lastWeek.setDate(today.getDate() - 7)
                  handleSelect({ from: lastWeek, to: today })
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-secondary"
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const lastMonth = new Date(today)
                  lastMonth.setMonth(today.getMonth() - 1)
                  handleSelect({ from: lastMonth, to: today })
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-secondary"
              >
                Último mês
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const lastQuarter = new Date(today)
                  lastQuarter.setMonth(today.getMonth() - 3)
                  handleSelect({ from: lastQuarter, to: today })
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-secondary"
              >
                Último trimestre
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

