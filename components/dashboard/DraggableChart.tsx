'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface DraggableChartProps {
  readonly id: string
  readonly span?: number
  readonly children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>) => ReactNode
}

const spanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-3',
  4: 'col-span-1 md:col-span-4',
  5: 'col-span-1 md:col-span-5',
  6: 'col-span-1 md:col-span-6',
}

export default function DraggableChart({ id, span = 1, children }: DraggableChartProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandleProps: React.HTMLAttributes<HTMLDivElement> = {
    ...attributes,
    ...listeners,
    style: { cursor: 'grab', userSelect: 'none' },
  }

  const spanClass = spanClasses[span] || spanClasses[1]

  return (
    <div ref={setNodeRef} style={style} className={spanClass}>
      {children(dragHandleProps)}
    </div>
  )
}

