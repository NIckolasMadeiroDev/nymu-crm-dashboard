'use client'

import CapacityOfAttendance from './CapacityOfAttendance'
import type { CapacityMetrics } from '@/types/dashboard'

interface CapacityOfAttendanceWithControlsProps {
  readonly data: CapacityMetrics
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function CapacityOfAttendanceWithControls({
  data,
  dragHandleProps,
}: CapacityOfAttendanceWithControlsProps) {
  return (
    <div {...dragHandleProps}>
      <CapacityOfAttendance data={data} />
    </div>
  )
}

