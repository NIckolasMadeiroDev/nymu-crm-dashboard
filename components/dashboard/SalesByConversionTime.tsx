'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { SalesByConversionTime } from '@/types/dashboard'
import { formatNumber } from '@/utils/format-currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface SalesByConversionTimeProps {
  readonly data: SalesByConversionTime
}

export default function SalesByConversionTimeComponent({
  data,
}: SalesByConversionTimeProps) {
  const chartData = useMemo(() => {
    const labels = data.sevenDays.map((item) => `${item.days}d`)

    return {
      labels,
      datasets: [
        {
          label: '7 Dias',
          data: data.sevenDays.map((item) => item.value),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: '30 Dias',
          data: data.thirtyDays.map((item) => item.value),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
        {
          label: '90 Dias',
          data: data.ninetyDays.map((item) => item.value),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
        {
          label: '180 Dias',
          data: data.oneEightyDays.map((item) => item.value),
          borderColor: 'rgba(251, 191, 36, 1)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
        },
      ],
    }
  }, [data])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatNumber(value)
          },
        },
      },
    },
  }

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
      aria-labelledby="sales-conversion-time-title"
    >
      <h2 id="sales-conversion-time-title" className="text-xl font-bold font-primary mb-6 text-gray-900">
        Vendas por Tempo de Conversão
      </h2>

      <div className="h-64" aria-label="Gráfico de vendas por tempo de conversão">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  )
}

