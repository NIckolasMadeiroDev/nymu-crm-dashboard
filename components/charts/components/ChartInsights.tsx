'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Info } from 'lucide-react'
import { useThemeColors } from '../hooks/useThemeColors'
import type { Anomaly, Insight } from '@/services/analytics/data-analysis-service'

interface ChartInsightsProps {
  anomalies: Anomaly[]
  insights: Insight[]
  defaultExpanded?: boolean
}

export default function ChartInsights({
  anomalies,
  insights,
  defaultExpanded = true,
}: Readonly<ChartInsightsProps>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')
  const contentRef = useRef<HTMLDivElement>(null)
  const themeColors = useThemeColors()

  const hasAnomalies = anomalies.length > 0
  const hasInsights = insights.length > 0

  const softBackground = useMemo(() => {
    const isLight = themeColors.background === '#ffffff' || themeColors.background.toLowerCase().includes('fff')
    if (isLight) {
      return '#f8fafc'
    }
    return '#1e293b'
  }, [themeColors.background])

  const cardBackground = useMemo(() => {
    const isLight = themeColors.background === '#ffffff' || themeColors.background.toLowerCase().includes('fff')
    if (isLight) {
      return '#ffffff'
    }
    return '#0f172a'
  }, [themeColors.background])

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      let resizeTimeout: NodeJS.Timeout | null = null
      let isUpdating = false

      const updateHeight = () => {
        if (isUpdating || !contentRef.current) return
        isUpdating = true

        requestAnimationFrame(() => {
          if (contentRef.current) {

            const maxHeight = (typeof globalThis !== 'undefined' && globalThis.innerHeight) ? globalThis.innerHeight * 0.6 : 400
            const calculatedHeight = contentRef.current.scrollHeight
            const height = Math.min(maxHeight, calculatedHeight)
            setContentHeight(height)
          }
          isUpdating = false
        })
      }

      updateHeight()

      const resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(updateHeight, 50)
      })
      resizeObserver.observe(contentRef.current)

      const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(updateHeight, 100)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        resizeObserver.disconnect()
        if (resizeTimeout) clearTimeout(resizeTimeout)
        window.removeEventListener('resize', handleResize)
        isUpdating = false
      }
    } else {
      setContentHeight(0)
    }
  }, [isExpanded, anomalies, insights])

  if (!hasAnomalies && !hasInsights) {
    return null
  }

  const getAnomalyIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="w-4 h-4" />
      case 'drop':
        return <TrendingDown className="w-4 h-4" />
      case 'outlier':
        return <AlertTriangle className="w-4 h-4" />
      case 'trend_change':
        return <BarChart3 className="w-4 h-4" />
    }
  }

  const getAnomalyColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high':
        return themeColors.error
      case 'medium':
        return themeColors.warning
      case 'low':
        return themeColors.info
    }
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'comparison':
        return <BarChart3 className="w-4 h-4" />
      case 'trend':
        return <TrendingUp className="w-4 h-4" />
      case 'statistical':
        return <Info className="w-4 h-4" />
      case 'performance':
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getInsightColor = (significance: Insight['significance']) => {
    switch (significance) {
      case 'high':
        return themeColors.primary
      case 'medium':
        return themeColors.info
      case 'low':
        return themeColors.gridColor
    }
  }

  const formatObjectLabel = (labelObj: Record<string, unknown>): string => {
    const keys = Object.keys(labelObj)
    if (keys.length === 0) return ''

    if (keys.length === 1) {
      const firstValue = labelObj[keys[0]]
      if (firstValue !== undefined && firstValue !== null) {
        return formatLabel(firstValue)
      }
    }

    const formattedPairs: string[] = []
    const keyTranslations: Record<string, string> = {
      date: 'Data',
      sevenDays: '7 dias',
      thirtyDays: '30 dias',
      ninetyDays: '90 dias',
      oneEightyDays: '180 dias',
      value: 'Valor',
      name: 'Nome',
      label: 'Rótulo',
    }

    for (const key of keys) {
      const value = labelObj[key]
      if (value !== undefined && value !== null) {
        const formattedKey = keyTranslations[key] || key
        let formattedValue: string

        if (typeof value === 'number') {
          formattedValue = value.toLocaleString('pt-BR')
        } else if (typeof value === 'string') {
          formattedValue = value
        } else if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value, null, 2)
        } else {
          formattedValue = String(value)
        }

        formattedPairs.push(`${formattedKey}: ${formattedValue}`)
      }
    }

    return formattedPairs.length > 0 ? formattedPairs.join(' • ') : ''
  }

  const formatLabel = (label: unknown): string => {
    if (label === null || label === undefined) return ''
    if (typeof label === 'string') return label
    if (typeof label === 'number') return label.toLocaleString('pt-BR')
    if (typeof label === 'boolean') return String(label)
    if (Array.isArray(label)) {
      return label.map(item => formatLabel(item)).filter(Boolean).join(', ')
    }
    if (typeof label === 'object') {
      return formatObjectLabel(label as Record<string, unknown>)
    }
    return ''
  }

  return (
    <div
      className="mt-2 sm:mt-2.5 rounded-xl border overflow-hidden shadow-sm"
      style={{
        backgroundColor: cardBackground,
        borderColor: themeColors.gridColor,
        transition: 'none',
        transitionProperty: 'none',
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          backgroundColor: cardBackground,
          borderBottom: isExpanded ? `1px solid ${themeColors.gridColor}` : 'none',
        }}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Ocultar análises' : 'Mostrar análises'}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div
              className="p-0.5 sm:p-1 rounded-lg"
              style={{
                backgroundColor: `${themeColors.primary}15`,
                color: themeColors.primary,
              }}
            >
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            </div>
            <span
              className="text-xs sm:text-sm font-bold font-primary"
              style={{ color: themeColors.foreground }}
            >
              Análise de Dados
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {hasAnomalies && (
              <span
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: `${themeColors.error}15`,
                  color: themeColors.error,
                  border: `1px solid ${themeColors.error}30`,
                }}
              >
                {anomalies.length} {anomalies.length === 1 ? 'anomalia' : 'anomalias'}
              </span>
            )}
            {hasInsights && (
              <span
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: `${themeColors.primary}15`,
                  color: themeColors.primary,
                  border: `1px solid ${themeColors.primary}30`,
                }}
              >
                {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-1.5 sm:ml-2">
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: themeColors.foreground, opacity: 0.7 }} />
          ) : (
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: themeColors.foreground, opacity: 0.7 }} />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: softBackground,
          height: typeof contentHeight === 'number' ? `${contentHeight}px` : contentHeight,
          maxHeight: isExpanded ? 'none' : '0px',
          transition: 'opacity 0.2s ease-in-out',
          transitionProperty: 'opacity',
        }}
      >
        <div
          ref={contentRef}
          className="px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-2.5"
          style={{
            backgroundColor: softBackground,
            minHeight: isExpanded ? 'auto' : 0,
          }}
        >

          {hasAnomalies && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 sm:pb-1">
                <div
                  className="p-0.5 sm:p-1 rounded-lg"
                  style={{
                    backgroundColor: `${themeColors.error}15`,
                    color: themeColors.error,
                  }}
                >
                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                </div>
                <h4
                  className="text-base sm:text-lg font-bold font-primary"
                  style={{ color: themeColors.foreground }}
                >
                  Detecção de Anomalias
                </h4>
              </div>
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {anomalies.slice(0, 5).map((anomaly) => {
                  const anomalyKey = `anomaly-${anomaly.type}-${anomaly.index}-${anomaly.value}`

                  let anomalyTypeLabel = 'Mudança de Tendência'
                  if (anomaly.type === 'spike') {
                    anomalyTypeLabel = 'Pico'
                  } else if (anomaly.type === 'drop') {
                    anomalyTypeLabel = 'Queda'
                  } else if (anomaly.type === 'outlier') {
                    anomalyTypeLabel = 'Outlier'
                  }

                  let anomalySeverityLabel = 'Baixa'
                  if (anomaly.severity === 'high') {
                    anomalySeverityLabel = 'Alta'
                  } else if (anomaly.severity === 'medium') {
                    anomalySeverityLabel = 'Média'
                  }

                  return (
                  <div
                    key={anomalyKey}
                    className="p-2 sm:p-2.5 rounded-lg border-l-4 transition-all hover:shadow-md"
                    style={{
                      backgroundColor: cardBackground,
                      borderLeftColor: getAnomalyColor(anomaly.severity),
                      borderLeftWidth: '4px',
                      borderTop: `1px solid ${themeColors.gridColor}`,
                      borderRight: `1px solid ${themeColors.gridColor}`,
                      borderBottom: `1px solid ${themeColors.gridColor}`,
                    }}
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <div
                        className="flex-shrink-0 mt-0.5 p-1 sm:p-1.5 rounded-lg"
                        style={{
                          color: getAnomalyColor(anomaly.severity),
                          backgroundColor: `${getAnomalyColor(anomaly.severity)}15`,
                        }}
                      >
                        {getAnomalyIcon(anomaly.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                          <span
                            className="text-xs font-bold uppercase tracking-wide px-2 sm:px-2.5 py-0.5 sm:py-1 rounded"
                            style={{
                              color: getAnomalyColor(anomaly.severity),
                              backgroundColor: `${getAnomalyColor(anomaly.severity)}10`,
                            }}
                          >
                            {anomalyTypeLabel}
                          </span>
                          <span
                            className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor: getAnomalyColor(anomaly.severity),
                              color: '#ffffff',
                            }}
                          >
                            {anomalySeverityLabel}
                          </span>
                          {anomaly.label && (
                            <span
                              className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-medium"
                              style={{
                                color: themeColors.foreground,
                                backgroundColor: `${themeColors.gridColor}40`,
                              }}
                            >
                              {formatLabel(anomaly.label)}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs font-secondary leading-relaxed mb-1.5 sm:mb-2"
                          style={{ color: themeColors.foreground, opacity: 0.9 }}
                        >
                          {anomaly.description}
                        </p>
                        {anomaly.percentageChange !== undefined && (
                          <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t" style={{ borderColor: themeColors.gridColor }}>
                            <span
                              className="text-xs font-medium"
                              style={{ color: themeColors.foreground, opacity: 0.75 }}
                            >
                              Variação:
                            </span>
                            <span
                              className="text-xs font-bold px-2 py-1 rounded"
                              style={{
                                color: cardBackground,
                                backgroundColor: anomaly.percentageChange > 0 ? themeColors.error : themeColors.success,
                              }}
                            >
                              {anomaly.percentageChange > 0 ? '+' : ''}
                              {anomaly.percentageChange.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
                {anomalies.length > 5 && (
                  <div className="pt-2 text-center">
                    <p
                      className="text-xs font-medium"
                      style={{ color: themeColors.foreground, opacity: 0.7 }}
                    >
                      +{anomalies.length - 5}{' '}
                      {anomalies.length - 5 === 1 ? 'anomalia adicional' : 'anomalias adicionais'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasInsights && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 sm:pb-1">
                <div
                  className="p-0.5 sm:p-1 rounded-lg"
                  style={{
                    backgroundColor: `${themeColors.primary}15`,
                    color: themeColors.primary,
                  }}
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                </div>
                <h4
                  className="text-base sm:text-lg font-bold font-primary"
                  style={{ color: themeColors.foreground }}
                >
                  Explicabilidade dos Dados
                </h4>
              </div>
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {insights.map((insight) => {
                  const insightKey = `insight-${insight.type}-${insight.title}`

                  return (
                  <div
                    key={insightKey}
                    className="p-2 sm:p-2.5 rounded-lg border-l-4 transition-all hover:shadow-md"
                    style={{
                      backgroundColor: cardBackground,
                      borderLeftColor: getInsightColor(insight.significance),
                      borderLeftWidth: '4px',
                      borderTop: `1px solid ${themeColors.gridColor}`,
                      borderRight: `1px solid ${themeColors.gridColor}`,
                      borderBottom: `1px solid ${themeColors.gridColor}`,
                    }}
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <div
                        className="flex-shrink-0 mt-0.5 p-1 sm:p-1.5 rounded-lg"
                        style={{
                          color: getInsightColor(insight.significance),
                          backgroundColor: `${getInsightColor(insight.significance)}15`,
                        }}
                      >
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                          <h5
                            className="text-xs sm:text-sm font-bold font-primary"
                            style={{ color: themeColors.foreground }}
                          >
                            {insight.title}
                          </h5>
                          {insight.value !== undefined && insight.value !== null && (
                          <span
                            className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-bold whitespace-nowrap"
                            style={{
                              backgroundColor: getInsightColor(insight.significance),
                              color: '#ffffff',
                            }}
                          >
                            {formatLabel(insight.value)}
                          </span>
                          )}
                        </div>
                        <p
                          className="text-xs font-secondary leading-relaxed"
                          style={{ color: themeColors.foreground, opacity: 0.9 }}
                        >
                          {insight.description}
                        </p>
                        {insight.comparison && (
                          <div
                            className="mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 space-y-1.5 sm:space-y-2 border-t"
                            style={{ borderColor: themeColors.gridColor }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className="text-xs font-medium"
                                style={{ color: themeColors.foreground, opacity: 0.75 }}
                              >
                                {formatLabel(insight.comparison.label)}:
                              </span>
                              <span
                                className="text-xs font-semibold px-2 py-1 rounded"
                                style={{
                                  color: themeColors.foreground,
                                  backgroundColor: `${themeColors.gridColor}30`,
                                }}
                              >
                                {formatLabel(insight.comparison.value)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className="text-xs font-medium"
                                style={{ color: themeColors.foreground, opacity: 0.75 }}
                              >
                                Diferença:
                              </span>
                              <span
                                className="text-xs font-bold px-2 py-1 rounded"
                                style={{
                                  color: cardBackground,
                                  backgroundColor: (() => {
                                    const diffLabel = formatLabel(insight.comparison.difference)
                                    return diffLabel.startsWith('+') ? themeColors.success : themeColors.error
                                  })(),
                                }}
                              >
                                {formatLabel(insight.comparison.difference)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

