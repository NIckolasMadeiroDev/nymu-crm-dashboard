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
import type { LeadStock } from '@/types/dashboard'
import { formatNumber } from '@/utils/format-currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface LeadStockProps {
  readonly data: LeadStock
}

export default function LeadStockComponent({ data }: LeadStockProps) {
  const chartData = useMemo(() => {
    return {
      labels: ['Lista de Contato', 'Primeiro Contato', 'No Grupo', 'Pós-Meet'],
      datasets: [
        {
          label: 'Leads',
          data: [data.contactList, data.firstContact, data.inGroup, data.postMeet],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(251, 191, 36, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(5, 150, 105, 0.7)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(5, 150, 105, 1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [data])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Leads: ${formatNumber(context.parsed.y)}`
          },
        },
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        padding: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatNumber(value)
          },
          font: {
            size: 10,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  }

  const legendItems = [
    { label: 'Lista de Contato', color: 'bg-green-500' },
    { label: 'Primeiro Contato', color: 'bg-yellow-500' },
    { label: 'No Grupo', color: 'bg-red-500' },
    { label: 'Pós-Meet', color: 'bg-green-700' },
  ]

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100"
      aria-labelledby="lead-stock-title"
    >
      <h2 id="lead-stock-title" className="text-base sm:text-lg md:text-xl font-bold font-primary mb-3 sm:mb-4 md:mb-6 text-gray-900">
        Estoque de Leads
      </h2>

      <div className="mb-2 sm:mb-3 md:mb-4 flex flex-wrap gap-1.5 sm:gap-2 md:gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded flex-shrink-0 ${item.color}`} />
            <span className="text-xs text-gray-700 font-secondary">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="h-40 sm:h-48 md:h-64" aria-label="Gráfico de estoque de leads por estágio">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </section>
  )
}

