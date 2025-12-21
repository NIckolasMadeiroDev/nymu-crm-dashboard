'use client'

import { useRef } from 'react'

interface ColorPickerProps {
  readonly label: string
  readonly value: string
  readonly onChange: (color: string) => void
  readonly description?: string
}

export default function ColorPicker({
  label,
  value,
  onChange,
  description,
}: Readonly<ColorPickerProps>) {
  const colorInputRef = useRef<HTMLInputElement>(null)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleColorButtonClick = () => {
    colorInputRef.current?.click()
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={handleColorChange}
          className="sr-only"
          aria-label={`Color picker nativo para ${label}`}
        />
        <button
          type="button"
          onClick={handleColorButtonClick}
          className="w-12 h-10 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          style={{ backgroundColor: value }}
          aria-label={`Selecionar cor para ${label}`}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            let newValue = e.target.value.toUpperCase().replace(/[^0-9A-F#]/g, '')
            if (!newValue.startsWith('#')) {
              newValue = `#${newValue.replace(/#/g, '')}`
            }
            if (newValue.length > 7) {
              newValue = newValue.substring(0, 7)
            }
            if (newValue.length >= 4) {
              onChange(newValue)
            }
          }}
          onBlur={(e) => {
            let newValue = e.target.value.toUpperCase().replace(/[^0-9A-F#]/g, '')
            if (!newValue.startsWith('#')) {
              newValue = `#${newValue.replace(/#/g, '')}`
            }
            if (newValue.length < 7) {
              newValue = newValue.padEnd(7, '0')
            }
            onChange(newValue)
          }}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  )
}


