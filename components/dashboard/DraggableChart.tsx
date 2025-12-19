'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface DraggableChartProps {
  readonly id: string
  readonly children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>) => ReactNode
}

export default function DraggableChart({ id, children }: DraggableChartProps) {
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

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandleProps)}
    </div>
  )
}

