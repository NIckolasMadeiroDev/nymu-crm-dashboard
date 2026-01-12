'use client'

import { useMemo } from 'react'
import type { TooltipProps } from 'recharts'
import { formatNumber } from '@/utils/format-currency'

interface EnhancedTooltipProps extends TooltipProps<any, any> {
  readonly active?: boolean
  readonly payload?: Array<any>
  readonly label?: any
  readonly showFullDetails?: boolean
  readonly title?: string
  readonly chartTitle?: string
  readonly additionalInfo?: Record<string, any>
}

export function EnhancedTooltip(props: Readonly<EnhancedTooltipProps>) {
  const {
    active,
    payload,
    label,
    showFullDetails = false,
    chartTitle,
    additionalInfo,
  } = props
  
  // Calcular totais se houver múltiplas séries - hooks devem ser chamados antes de qualquer return
  const totalValue = useMemo(() => {
    if (!payload || payload.length === 0) return 0
    return payload.reduce((sum: number, entry: any) => {
      const value = typeof entry.value === 'number' ? entry.value : 0
      return sum + value
    }, 0)
  }, [payload])

  // Early return após hooks
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // Extrair informações do payload
  const mainData = payload[0]?.payload || {}
  const fullLabel = mainData.fullLabel || mainData.dateLabel || label
  const week = mainData.week || mainData.weekNumber
  const days = mainData.days
  const date = mainData.date
  const calculatedTotal = mainData.totalValue || totalValue

  // Formatar label principal
  const formatMainLabel = () => {
    if (showFullDetails && fullLabel) {
      return fullLabel
    }
    if (typeof label === 'string') {
      return label.replaceAll('\n', ' - ')
    }
    return String(label)
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[240px] max-w-[320px]"
      style={{ zIndex: 1000 }}
    >
      {/* Cabeçalho com informações principais */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
          {formatMainLabel()}
        </p>
        {week && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            📅 Semana {week}
          </p>
        )}
        {days && typeof days === 'number' && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            ⏱️ Tempo de conversão: {days} {days === 1 ? 'dia' : 'dias'}
          </p>
        )}
        {date && typeof date === 'string' && date.includes('d') && !days && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            ⏱️ Tempo de conversão: {date.replace('d', '')} {date.replace('d', '') === '1' ? 'dia' : 'dias'}
          </p>
        )}
      </div>

      {/* Valores das séries com mais detalhes */}
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => {
          const value = typeof entry.value === 'number' ? entry.value : 0
          let name = entry.name || entry.dataKey || 'Valor'
          
          // Mapear labels baseado no título do gráfico ou dataKey
          // Se o name for "value" ou o dataKey for "value", usar labels customizados
          if ((name === 'value' || entry.dataKey === 'value') && payload.length === 1) {
            // Usar chartTitle passado como prop ou tentar obter do payload
            const title = chartTitle || mainData._chartTitle || entry.payload?._chartTitle
            if (title) {
              if (title.includes('Leads Criados por Semana') || title.includes('Geração e Ativação')) {
                name = 'Leads'
              } else if (title.includes('Vendas por Semana') || title.includes('Conversão de Vendas')) {
                name = 'Vendas por Semana'
              } else if (title.includes('Vendas por Tempo de Conversão')) {
                name = 'Vendas por Conversão'
              }
            }
          }
          
          const color = entry.color || '#3b82f6'
          const percentage = calculatedTotal > 0 ? ((value / calculatedTotal) * 100).toFixed(1) : '0'
          const entryKey = entry.dataKey || entry.name || `entry-${index}`
          
          return (
            <div key={entryKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {formatNumber(value)}
                </span>
                {payload.length > 1 && calculatedTotal > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({percentage}%)
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total se houver múltiplas séries */}
      {payload.length > 1 && calculatedTotal > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Total Geral:
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {formatNumber(calculatedTotal)}
            </span>
          </div>
        </div>
      )}
      
      {/* Informações adicionais para tempo de conversão */}
      {mainData.activeSeriesCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Séries ativas:</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{mainData.activeSeriesCount}</span>
            </div>
            {mainData.maxSeriesName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Maior valor:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {mainData.maxSeriesName} ({formatNumber(mainData.maxSeriesValue || 0)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações adicionais contextuais */}
      {mainData.variation !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Variação vs média:</span>
            <span className={`font-semibold ${mainData.isAboveAverage ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {mainData.isAboveAverage ? '+' : ''}{mainData.variation}%
            </span>
          </div>
        </div>
      )}
      
      {additionalInfo && Object.keys(additionalInfo).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Informações adicionais:
          </p>
          <div className="space-y-1">
            {Object.entries(additionalInfo).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{key}:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

