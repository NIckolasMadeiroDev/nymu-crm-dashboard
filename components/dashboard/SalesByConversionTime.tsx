'use client'

import { useMemo, useState, useEffect } from 'react'
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
import { formatChartValue, formatAdaptiveNumber } from '@/utils/format-currency'

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
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Detectar se precisa usar formatação adaptativa
  const allValues = useMemo(() => {
    const values: number[] = []
    ;[data.sevenDays, data.thirtyDays, data.ninetyDays, data.oneEightyDays].forEach((series) => {
      series.forEach((item) => {
        if (typeof item.value === 'number') {
          values.push(Math.abs(item.value))
        }
      })
    })
    return values
  }, [data])

  const maxValue = useMemo(() => Math.max(...allValues, 0), [allValues])
  const useAdaptive = maxValue >= 1000
  const adaptiveScale = useMemo(() => {
    if (!useAdaptive) return { scale: 1, unit: '' }
    const sample = formatAdaptiveNumber(maxValue)
    return { scale: sample.scale, unit: sample.unit }
  }, [useAdaptive, maxValue])

  const chartData = useMemo(() => {
    const labels = data.sevenDays.map((item) => `${item.days}d`)

    // Se usando formatação adaptativa, escalar os valores para exibição
    const scaleData = (value: number) => {
      if (useAdaptive && adaptiveScale.scale > 1) {
        return value / adaptiveScale.scale
      }
      return value
    }

    return {
      labels,
      datasets: [
        {
          label: '7 Dias',
          data: data.sevenDays.map((item) => scaleData(item.value)),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: '30 Dias',
          data: data.thirtyDays.map((item) => scaleData(item.value)),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
        {
          label: '90 Dias',
          data: data.ninetyDays.map((item) => scaleData(item.value)),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
        {
          label: '180 Dias',
          data: data.oneEightyDays.map((item) => scaleData(item.value)),
          borderColor: 'rgba(251, 191, 36, 1)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
        },
      ],
    }
  }, [data, useAdaptive, adaptiveScale])

  // Calcular domínio adaptativo - sempre calcular para garantir que valores altos sejam exibidos corretamente
  const yAxisDomain = useMemo(() => {
    if (maxValue === 0) {
      return [0, 100] // Valor padrão quando não há dados
    }
    
    // Sempre aplicar padding dinâmico baseado no valor máximo
    // Valores menores precisam de mais padding para melhor visualização
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
      // Quando usando formatação adaptativa, trabalhar com valores escalados
      const scaledMax = maxWithPadding / adaptiveScale.scale
      
      // Arredondar para valor "bonito" (múltiplos de potências de 10)
      const magnitude = Math.pow(10, Math.floor(Math.log10(scaledMax)))
      let roundedMax = Math.ceil(scaledMax / magnitude) * magnitude
      
      // Garantir que o valor arredondado seja sempre maior que o máximo escalado
      if (roundedMax <= scaledMax) {
        roundedMax += magnitude
      }
      
      // Garantir mínimo de 20% acima do máximo escalado
      const minRequiredMax = (maxValue / adaptiveScale.scale) * 1.2
      if (roundedMax < minRequiredMax) {
        roundedMax = Math.ceil(minRequiredMax / magnitude) * magnitude
        if (roundedMax <= minRequiredMax) {
          roundedMax += magnitude
        }
      }
      
      return [0, roundedMax]
    } else {
      // Para valores menores, arredondar normalmente
      const magnitude = Math.pow(10, Math.floor(Math.log10(maxWithPadding)))
      let roundedMax = Math.ceil(maxWithPadding / magnitude) * magnitude
      
      // Garantir que o valor arredondado seja sempre maior que o máximo
      if (roundedMax <= maxWithPadding) {
        roundedMax += magnitude
      }
      
      // Para valores muito pequenos, usar incrementos menores
      if (maxValue < 10) {
        roundedMax = Math.ceil(maxWithPadding / 2) * 2
        if (roundedMax <= maxWithPadding) roundedMax += 2
      } else if (maxValue < 50) {
        roundedMax = Math.ceil(maxWithPadding / 5) * 5
        if (roundedMax <= maxWithPadding) roundedMax += 5
      }
      
      // Garantir mínimo de padding mesmo após arredondamento
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
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: isSmallScreen ? 10 : 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            // Converter valor escalado de volta para o valor original no tooltip
            let value = context.parsed.y
            if (useAdaptive && adaptiveScale.scale > 1) {
              value = value * adaptiveScale.scale
            }
            const formatted = formatChartValue(value, useAdaptive)
            return `${context.dataset.label}: ${formatted}`
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
            // Se usando formatação adaptativa, converter o valor de volta para o formato original
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
  }), [useAdaptive, adaptiveScale, isSmallScreen, yAxisDomain])

  return (
    <section
      className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border border-gray-100"
      aria-labelledby="sales-conversion-time-title"
    >
      <h2 id="sales-conversion-time-title" className="text-base sm:text-lg md:text-xl font-bold font-primary mb-3 sm:mb-4 md:mb-6 text-gray-900">
        Vendas por Tempo de Conversão
      </h2>

      <div className="h-48 sm:h-56 md:h-64" aria-label="Gráfico de vendas por tempo de conversão">
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  )
}


