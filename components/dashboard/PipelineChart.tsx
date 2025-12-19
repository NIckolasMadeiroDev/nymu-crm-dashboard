'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { CrmPipeline } from '@/types/crm'
import { formatCurrency } from '@/utils/format-currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface PipelineChartProps {
  pipelines: CrmPipeline[]
}

export default function PipelineChart({ pipelines }: Readonly<PipelineChartProps>) {
  const chartData = useMemo(() => {
    const labels = pipelines.map((p) => p.name)
    const values = pipelines.map((p) => p.totalValue)
    const dealCounts = pipelines.map((p) => p.totalDeals)

    return {
      labels,
      datasets: [
        {
          label: 'Total Value',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Deal Count',
          data: dealCounts,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    }
  }, [pipelines])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            if (context.datasetIndex === 0) {
              return `Value: ${formatCurrency(context.parsed.y)}`
            }
            return `Deals: ${context.parsed.y}`
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value)
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  )
}

