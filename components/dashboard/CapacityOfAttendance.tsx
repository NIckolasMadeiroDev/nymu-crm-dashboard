'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { CapacityMetrics } from '@/types/dashboard'

interface CapacityOfAttendanceProps {
  readonly data: CapacityMetrics
}

export default function CapacityOfAttendance({ data }: CapacityOfAttendanceProps) {
  const performanceIcon = useMemo(() => {
    if (data.performance > 1.1) {
      return <TrendingUp className="w-5 h-5 text-green-600" />
    } else if (data.performance < 0.9) {
      return <TrendingDown className="w-5 h-5 text-red-600" />
    }
    return <Minus className="w-5 h-5 text-gray-600" />
  }, [data.performance])

  const performanceColor = useMemo(() => {
    if (data.performance > 1.1) return 'text-green-600'
    if (data.performance < 0.9) return 'text-red-600'
    return 'text-gray-600'
  }, [data.performance])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-primary">
        Capacidade de Atendimento
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-secondary">
        Número de atendimentos novos x concluídos
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Novos */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 font-secondary">
              Novos
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 font-primary mb-1">
            {data.new.total}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-secondary">
            média {data.new.averagePerDay.toFixed(1)}/dia
          </div>
        </div>

        {/* Concluídos */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-300 font-secondary">
              Concluídos
            </span>
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100 font-primary mb-1">
            {data.completed.total}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 font-secondary">
            média {data.completed.averagePerDay.toFixed(1)}/dia
          </div>
        </div>
      </div>

      {/* Desempenho */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary">
            Desempenho
          </span>
          <div className="flex items-center gap-2">
            {performanceIcon}
            <span className={`text-2xl font-bold ${performanceColor} font-primary`}>
              {data.performance.toFixed(1)}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-secondary">
          {data.performance > 1
            ? 'Mais atendimentos concluídos do que iniciados'
            : data.performance < 1
            ? 'Menos atendimentos concluídos do que iniciados'
            : 'Equilíbrio entre novos e concluídos'}
        </p>
      </div>
    </div>
  )
}

