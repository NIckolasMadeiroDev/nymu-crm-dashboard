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
import type { SalesConversionMetrics } from '@/types/dashboard'
import { formatCurrency, formatNumber } from '@/utils/format-currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface SalesConversionProps {
  readonly data: SalesConversionMetrics
}

export default function SalesConversion({ data }: Readonly<SalesConversionProps>) {
  const chartData = useMemo(() => {
    return {
      labels: data.salesByWeek.map((w) => w.label),
      datasets: [
        {
          label: 'Vendas',
          data: data.salesByWeek.map((w) => w.value),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
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
            return `Vendas: ${formatNumber(context.parsed.y)}`
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

  const progressPercentage = (data.closingRate / data.targetRate) * 100

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100"
      aria-labelledby="sales-conversion-title"
    >
      <h2 id="sales-conversion-title" className="text-base sm:text-lg md:text-xl font-bold font-primary mb-3 sm:mb-4 md:mb-6 text-gray-900">
        Conversão de Vendas
      </h2>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4 md:mb-6 border-0 p-0 m-0">
        <legend className="sr-only">Métricas de conversão de vendas</legend>
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Vendas Fechadas</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary break-words">
            {formatNumber(data.closedSales)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Taxa de Fechamento</p>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary">
              {data.closingRate.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 font-secondary">Meta: {data.targetRate}%</p>
          </div>
          <div className="mt-1.5 sm:mt-2 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-green-600 h-1.5 sm:h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4 sm:col-span-2 md:col-span-1">
          <p className="text-xs text-gray-600 font-secondary mb-0.5 sm:mb-1">Receita Gerada</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-primary break-words">
            {formatCurrency(data.revenueGenerated)}
          </p>
        </div>
      </fieldset>

      <div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 font-secondary mb-2 sm:mb-3 md:mb-4">
          Vendas por Semana
        </h3>
        <div className="h-40 sm:h-48 md:h-64" aria-label="Gráfico de vendas por semana">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  )
}

