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
import type { GenerationActivationMetrics } from '@/types/dashboard'
import { formatNumber } from '@/utils/format-currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface GenerationActivationProps {
  readonly data: GenerationActivationMetrics
}

export default function GenerationActivation({ data }: GenerationActivationProps) {
  const chartData = useMemo(() => {
    const sortedData = [...data.leadsCreatedByWeek].sort((a, b) => a.week - b.week)
    
    return {
      labels: sortedData.map((w) => w.label),
      datasets: [
        {
          label: 'Leads Criados',
          data: sortedData.map((w) => w.value),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
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

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100"
      aria-labelledby="generation-activation-title"
    >
      <h2 id="generation-activation-title" className="text-base sm:text-lg md:text-xl font-bold font-primary mb-3 sm:mb-4 md:mb-6 text-gray-900">
        Geração e Ativação
      </h2>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4 md:mb-6 border-0 p-0 m-0">
        <legend className="sr-only">Métricas de geração e ativação</legend>
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Leads Criados</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary break-words">
            {formatNumber(data.leadsCreated)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Leads no Grupo</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary break-words">
            {formatNumber(data.leadsInGroup)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Participantes no Meet</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary break-words">
            {formatNumber(data.meetParticipants)}
          </p>
        </div>
      </fieldset>

      <div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 font-secondary mb-2 sm:mb-3 md:mb-4">
          Leads Criados por Semana
        </h3>
        <div className="h-40 sm:h-48 md:h-64" aria-label="Gráfico de leads criados por semana">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  )
}

