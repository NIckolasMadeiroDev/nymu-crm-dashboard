'use client'

import { useMemo, useState, useEffect } from 'react'
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
import { formatCurrency, formatNumber, formatChartValue, formatAdaptiveNumber } from '@/utils/format-currency'

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
  readonly onDataPointClick?: (week: number, label: string) => void
}

export default function SalesConversion({ data, onDataPointClick }: Readonly<SalesConversionProps>) {
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const chartData = useMemo(() => {

    const scaleData = (value: number) => {
      if (useAdaptive && adaptiveScale.scale > 1) {
        return value / adaptiveScale.scale
      }
      return value
    }

    return {
      labels: data.salesByWeek.map((w) => w.label),
      datasets: [
        {
          label: 'Vendas',
          data: data.salesByWeek.map((w) => scaleData(w.value)),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
      ],
    }

  }, [data])

  const allValues = useMemo(() => {
    return data.salesByWeek.map((w) => Math.abs(w.value))
  }, [data])

  const maxValue = useMemo(() => Math.max(...allValues, 0), [allValues])
  const useAdaptive = maxValue >= 1000
  const adaptiveScale = useMemo(() => {
    if (!useAdaptive) return { scale: 1, unit: '' }
    const sample = formatAdaptiveNumber(maxValue)
    return { scale: sample.scale, unit: sample.unit }
  }, [useAdaptive, maxValue])

  const yAxisDomain = useMemo(() => {
    if (maxValue === 0) {
      return [0, 100] // Valor padrão quando não há dados
    }

    let paddingPercent = 0.15 // Padrão 15%
    if (maxValue < 50) {
      paddingPercent = 0.5 // 50% para valores muito pequenos
    } else if (maxValue < 200) {
      paddingPercent = 0.3 // 30% para valores pequenos
    } else if (maxValue < 1000) {
      paddingPercent = 0.2 // 20% para valores médios
    }

    const maxWithPadding = maxValue * (1 + paddingPercent)

    if (useAdaptive && adaptiveScale.scale > 1) {

      const scaledMax = maxWithPadding / adaptiveScale.scale

      const magnitude = Math.pow(10, Math.floor(Math.log10(scaledMax)))
      let roundedMax = Math.ceil(scaledMax / magnitude) * magnitude

      if (roundedMax <= scaledMax) {
        roundedMax += magnitude
      }

      const minRequiredMax = (maxValue / adaptiveScale.scale) * 1.2
      if (roundedMax < minRequiredMax) {
        roundedMax = Math.ceil(minRequiredMax / magnitude) * magnitude
        if (roundedMax <= minRequiredMax) {
          roundedMax += magnitude
        }
      }

      return [0, roundedMax]
    } else {

      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithPadding)))
      let roundedMax = Math.ceil(maxWithPadding / magnitude) * magnitude

      if (roundedMax <= maxWithPadding) {
        roundedMax += magnitude
      }

      if (maxValue < 10) {
        roundedMax = Math.ceil(maxWithPadding / 2) * 2
        if (roundedMax <= maxWithPadding) roundedMax += 2
      } else if (maxValue < 50) {
        roundedMax = Math.ceil(maxWithPadding / 5) * 5
        if (roundedMax <= maxWithPadding) roundedMax += 5
      }

      const minRequiredMax = maxValue * 1.15
      if (roundedMax < minRequiredMax) {
        roundedMax = Math.ceil(minRequiredMax / magnitude) * magnitude
        if (roundedMax <= minRequiredMax) {
          roundedMax += magnitude
        }
      }

      return [0, roundedMax]
    }
  }, [maxValue, useAdaptive, adaptiveScale])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {

            let value = context.parsed.y
            if (useAdaptive && adaptiveScale.scale > 1) {
              value = value * adaptiveScale.scale
            }
            const formatted = formatChartValue(value, useAdaptive)
            return `Vendas: ${formatted}`
          },
        },
        titleFont: {
          size: isSmallScreen ? 11 : 12,
        },
        bodyFont: {
          size: isSmallScreen ? 10 : 11,
        },
        padding: isSmallScreen ? 6 : 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: yAxisDomain[1], // Sempre definir o máximo para garantir que valores altos sejam exibidos
        ticks: {
          callback: function (value: any) {

            if (useAdaptive && adaptiveScale.scale > 1) {
              const originalValue = value * adaptiveScale.scale
              return formatChartValue(originalValue, useAdaptive)
            }
            return formatChartValue(value, false)
          },
          font: {
            size: isSmallScreen ? 9 : 10,
          },
          maxTicksLimit: isSmallScreen ? 5 : 8,
          stepSize: undefined, // Deixar Chart.js calcular automaticamente
        },
        ...(useAdaptive && adaptiveScale.unit ? {
          title: {
            display: true,
            text: `(${adaptiveScale.unit})`,
            font: {
              size: 9,
            },
          },
        } : {}),
      },
      x: {
        ticks: {
          font: {
            size: isSmallScreen ? 9 : 10,
          },
          maxRotation: isSmallScreen ? 45 : 0,
          minRotation: isSmallScreen ? 45 : 0,
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements && elements.length > 0 && onDataPointClick) {
        const element = elements[0]
        const weekData = data.salesByWeek[element.index]
        if (weekData) {
          onDataPointClick(weekData.week, weekData.label)
        }
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (event.native) {
        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    },
  }), [useAdaptive, adaptiveScale, isSmallScreen, yAxisDomain, data.salesByWeek, onDataPointClick])

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

