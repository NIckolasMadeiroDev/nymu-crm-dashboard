'use client'

import AttendancesByChannel from './AttendancesByChannel'
import type { ChannelMetrics } from '@/types/dashboard'

interface AttendancesByChannelWithControlsProps {
  readonly data: ChannelMetrics[]
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  readonly onDataPointClick?: (channel: string, label: string) => void
}

export default function AttendancesByChannelWithControls({
  data,
  dragHandleProps,
  onDataPointClick,
}: AttendancesByChannelWithControlsProps) {
  return (
    <AttendancesByChannel
      data={data}
      dragHandleProps={dragHandleProps}
      onDataPointClick={onDataPointClick}
    />
  )
}

