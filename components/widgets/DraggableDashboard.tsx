'use client'

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WidgetConfig } from '@/types/charts'

interface DraggableWidgetProps {
  readonly id: string
  readonly children: React.ReactNode
}

export function DraggableWidget({ id, children }: Readonly<DraggableWidgetProps>) {
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
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="cursor-grab active:cursor-grabbing"
        {...listeners}
        style={{ userSelect: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

interface DraggableDashboardProps {
  readonly widgets: WidgetConfig[]
  readonly onWidgetsChange: (widgets: WidgetConfig[]) => void
  readonly renderWidget: (widget: WidgetConfig) => React.ReactNode
}

export default function DraggableDashboard({
  widgets,
  onWidgetsChange,
  renderWidget,
}: Readonly<DraggableDashboardProps>) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id)
      const newIndex = widgets.findIndex((w) => w.id === over.id)

      const newWidgets = arrayMove(widgets, oldIndex, newIndex)
      onWidgetsChange(newWidgets)
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {widgets.map((widget) => (
            <DraggableWidget key={widget.id} id={widget.id}>
              {renderWidget(widget)}
            </DraggableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

