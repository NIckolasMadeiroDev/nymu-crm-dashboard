'use client'

import { ReactNode } from 'react'

interface RichTooltipProps {
  readonly content: ReactNode
  readonly title?: string
  readonly children: ReactNode
  readonly position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function RichTooltip({
  content,
  title,
  children,
  position = 'top',
}: Readonly<RichTooltipProps>) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={`absolute z-50 hidden group-hover:block ${getPositionClasses(position)}`}
        role="tooltip"
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 max-w-xs">
          {title && (
            <h4 className="font-semibold font-primary mb-2 text-sm">{title}</h4>
          )}
          <div className="text-xs font-secondary">{content}</div>
        </div>
      </div>
    </div>
  )
}

function getPositionClasses(position: string): string {
  switch (position) {
    case 'top':
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    case 'bottom':
      return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
    case 'left':
      return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
    case 'right':
      return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    default:
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
  }
}

