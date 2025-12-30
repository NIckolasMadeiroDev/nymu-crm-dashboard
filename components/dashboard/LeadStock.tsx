'use client'

import { useMemo, useState } from 'react'
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
import { formatNumber, formatCurrency } from '@/utils/format-currency'

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
  const [showDetails, setShowDetails] = useState(false)

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

  const totalLeads = data.contactList + data.firstContact + data.inGroup + data.postMeet
  const totalValue = data.totalValue || (data.contactListValue || 0) + (data.firstContactValue || 0) + (data.inGroupValue || 0) + (data.postMeetValue || 0)

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
            const index = context.dataIndex
            const values = [data.contactListValue || 0, data.firstContactValue || 0, data.inGroupValue || 0, data.postMeetValue || 0]
            const value = values[index] || 0
            return [
              `Leads: ${formatNumber(context.parsed.y)}`,
              `Valor: ${formatCurrency(value)}`
            ]
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
    { 
      label: 'Lista de Contato', 
      color: 'bg-green-500',
      count: data.contactList,
      value: data.contactListValue || 0
    },
    { 
      label: 'Primeiro Contato', 
      color: 'bg-yellow-500',
      count: data.firstContact,
      value: data.firstContactValue || 0
    },
    { 
      label: 'No Grupo', 
      color: 'bg-red-500',
      count: data.inGroup,
      value: data.inGroupValue || 0
    },
    { 
      label: 'Pós-Meet', 
      color: 'bg-green-700',
      count: data.postMeet,
      value: data.postMeetValue || 0
    },
  ]

  const categoryLabels: Record<string, string> = {
    contactList: 'Lista de Contato',
    firstContact: 'Primeiro Contato',
    inGroup: 'No Grupo',
    postMeet: 'Pós-Meet',
    other: 'Outros'
  }

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700"
      aria-labelledby="lead-stock-title"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <h2 id="lead-stock-title" className="text-base sm:text-lg md:text-xl font-bold font-primary text-gray-900 dark:text-white">
          Estoque de Leads
        </h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-secondary"
        >
          {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>

      {/* Resumo com valores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {legendItems.map((item) => (
          <div key={item.label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded flex-shrink-0 ${item.color}`} />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-secondary font-medium truncate">{item.label}</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-primary">
              {formatNumber(item.count)}
            </div>
            {item.value > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 font-secondary mt-0.5">
                {formatCurrency(item.value)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 font-secondary">
            Total
          </span>
          <div className="text-right">
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-primary">
              {formatNumber(totalLeads)} leads
            </div>
            {totalValue > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400 font-secondary">
                {formatCurrency(totalValue)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-40 sm:h-48 md:h-64 mb-3 sm:mb-4" aria-label="Gráfico de estoque de leads por estágio">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Detalhes por etapa */}
      {showDetails && data.byStep && data.byStep.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 font-secondary mb-3">
            Detalhes por Etapa
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.byStep.map((step) => (
              <div
                key={step.stepId}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white font-primary truncate">
                    {step.stepTitle}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-secondary">
                    {categoryLabels[step.category] || step.category}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-bold text-gray-900 dark:text-white font-primary">
                    {formatNumber(step.count)}
                  </div>
                  {step.value > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-secondary">
                      {formatCurrency(step.value)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

