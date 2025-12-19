'use client'

import { useEffect } from 'react'
import { X, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Info, TrendingUp as TrendingUpIcon } from 'lucide-react'
import { useThemeColors } from '../hooks/useThemeColors'
import type { Anomaly, Insight, DataAnalysisResult } from '@/services/analytics/data-analysis-service'
import { formatNumber, formatCurrency } from '@/utils/format-currency'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  analysis: DataAnalysisResult
}

export default function AnalysisModal({
  isOpen,
  onClose,
  title,
  analysis,
}: Readonly<AnalysisModalProps>) {
  const themeColors = useThemeColors()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasAnomalies = analysis.anomalies.length > 0
  const hasInsights = analysis.insights.length > 0
  const hasAnalysis = hasAnomalies || hasInsights

  const getAnomalyIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="w-5 h-5" />
      case 'drop':
        return <TrendingDown className="w-5 h-5" />
      case 'outlier':
        return <AlertTriangle className="w-5 h-5" />
      case 'trend_change':
        return <BarChart3 className="w-5 h-5" />
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

  const getAnomalyTypeLabel = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike':
        return 'Pico'
      case 'drop':
        return 'Queda'
      case 'outlier':
        return 'Valor Atípico'
      case 'trend_change':
        return 'Mudança de Tendência'
    }
  }

  const getAnomalySeverityLabel = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      case 'low':
        return 'Baixa'
    }
  }

  const formatLabel = (label: string | Record<string, unknown> | undefined): string => {
    if (!label) return ''
    if (typeof label === 'string') return label
    if (typeof label === 'object' && label !== null) {
      if ('name' in label) return String(label.name)
      if ('date' in label) return String(label.date)
    }
    return String(label)
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'comparison':
        return <BarChart3 className="w-5 h-5" />
      case 'trend':
        return <TrendingUpIcon className="w-5 h-5" />
      case 'statistical':
        return <Info className="w-5 h-5" />
      case 'performance':
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  const getInsightTypeLabel = (type: Insight['type']) => {
    switch (type) {
      case 'comparison':
        return 'Comparação'
      case 'trend':
        return 'Tendência'
      case 'statistical':
        return 'Estatístico'
      case 'performance':
        return 'Performance'
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'Crescimento'
      case 'decreasing':
        return 'Declínio'
      case 'stable':
        return 'Estável'
      default:
        return 'Estável'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themeColors.background,
          borderColor: themeColors.gridColor,
          borderWidth: '1px',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 sm:p-6 border-b"
          style={{ borderColor: themeColors.gridColor }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${themeColors.primary}15`,
                color: themeColors.primary,
              }}
            >
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="analysis-modal-title"
                className="text-lg sm:text-xl font-bold font-primary"
                style={{ color: themeColors.foreground }}
              >
                Análises - {title}
              </h2>
              {hasAnalysis && (
                <p className="text-xs sm:text-sm font-secondary mt-0.5" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                  {hasAnomalies && `${analysis.anomalies.length} ${analysis.anomalies.length === 1 ? 'anomalia' : 'anomalias'}`}
                  {hasAnomalies && hasInsights && ' • '}
                  {hasInsights && `${analysis.insights.length} ${analysis.insights.length === 1 ? 'insight' : 'insights'}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fechar modal"
            style={{ color: themeColors.foreground }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!hasAnalysis ? (
            <div className="text-center py-8 sm:py-12">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `${themeColors.primary}15`,
                  color: themeColors.primary,
                }}
              >
                <Info className="w-8 h-8" />
              </div>
              <h3
                className="text-lg sm:text-xl font-bold font-primary mb-2"
                style={{ color: themeColors.foreground }}
              >
                Nenhuma análise disponível
              </h3>
              <p
                className="text-sm sm:text-base font-secondary mb-6"
                style={{ color: themeColors.foreground, opacity: 0.7 }}
              >
                Não foram detectadas anomalias ou insights para este gráfico no momento.
              </p>

              {/* Estatísticas básicas */}
              {analysis.statistics && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Média
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {formatNumber(analysis.statistics.mean)}
                    </p>
                  </div>
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Mínimo
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {formatNumber(analysis.statistics.min)}
                    </p>
                  </div>
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Máximo
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {formatNumber(analysis.statistics.max)}
                    </p>
                  </div>
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Mediana
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {formatNumber(analysis.statistics.median)}
                    </p>
                  </div>
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Desvio Padrão
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {formatNumber(analysis.statistics.stdDev)}
                    </p>
                  </div>
                  <div
                    className="p-3 sm:p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.gridColor,
                    }}
                  >
                    <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                      Tendência
                    </p>
                    <p className="text-base sm:text-lg font-bold font-primary" style={{ color: themeColors.foreground }}>
                      {getTrendLabel(analysis.statistics.trend)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Anomalias */}
              {hasAnomalies && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle
                      className="w-5 h-5"
                      style={{ color: themeColors.error }}
                    />
                    <h3
                      className="text-base sm:text-lg font-bold font-primary"
                      style={{ color: themeColors.foreground }}
                    >
                      Anomalias Detectadas ({analysis.anomalies.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.anomalies.map((anomaly, index) => {
                      const anomalyKey = `anomaly-${anomaly.type}-${anomaly.index}-${index}`
                      const anomalyColor = getAnomalyColor(anomaly.severity)
                      return (
                        <div
                          key={anomalyKey}
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: themeColors.background,
                            borderColor: anomalyColor,
                            borderWidth: '2px',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{
                                backgroundColor: `${anomalyColor}15`,
                                color: anomalyColor,
                              }}
                            >
                              {getAnomalyIcon(anomaly.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
                                  style={{
                                    color: anomalyColor,
                                    backgroundColor: `${anomalyColor}15`,
                                  }}
                                >
                                  {getAnomalyTypeLabel(anomaly.type)}
                                </span>
                                <span
                                  className="text-xs px-2 py-1 rounded font-semibold"
                                  style={{
                                    backgroundColor: anomalyColor,
                                    color: '#ffffff',
                                  }}
                                >
                                  {getAnomalySeverityLabel(anomaly.severity)}
                                </span>
                                {anomaly.label && (
                                  <span
                                    className="text-xs px-2 py-1 rounded font-medium"
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
                                className="text-sm font-secondary leading-relaxed mb-2"
                                style={{ color: themeColors.foreground }}
                              >
                                {anomaly.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-secondary">
                                <span style={{ color: themeColors.foreground, opacity: 0.8 }}>
                                  Valor: <strong>{formatNumber(anomaly.value)}</strong>
                                </span>
                                {anomaly.previousValue !== undefined && (
                                  <span style={{ color: themeColors.foreground, opacity: 0.8 }}>
                                    Anterior: <strong>{formatNumber(anomaly.previousValue)}</strong>
                                  </span>
                                )}
                                {anomaly.percentageChange !== undefined && (
                                  <span style={{ color: themeColors.foreground, opacity: 0.8 }}>
                                    Variação: <strong>{anomaly.percentageChange > 0 ? '+' : ''}{anomaly.percentageChange.toFixed(1)}%</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Insights */}
              {hasInsights && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Info
                      className="w-5 h-5"
                      style={{ color: themeColors.primary }}
                    />
                    <h3
                      className="text-base sm:text-lg font-bold font-primary"
                      style={{ color: themeColors.foreground }}
                    >
                      Insights ({analysis.insights.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.insights.map((insight, index) => {
                      const insightKey = `insight-${insight.type}-${index}`
                      return (
                        <div
                          key={insightKey}
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: themeColors.background,
                            borderColor: themeColors.gridColor,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{
                                backgroundColor: `${themeColors.primary}15`,
                                color: themeColors.primary,
                              }}
                            >
                              {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
                                  style={{
                                    color: themeColors.primary,
                                    backgroundColor: `${themeColors.primary}15`,
                                  }}
                                >
                                  {getInsightTypeLabel(insight.type)}
                                </span>
                                <h4
                                  className="text-sm sm:text-base font-bold font-primary"
                                  style={{ color: themeColors.foreground }}
                                >
                                  {insight.title}
                                </h4>
                              </div>
                              <p
                                className="text-sm font-secondary leading-relaxed mb-2"
                                style={{ color: themeColors.foreground }}
                              >
                                {insight.description}
                              </p>
                              {insight.value !== undefined && (
                                <div className="text-xs font-secondary" style={{ color: themeColors.foreground, opacity: 0.8 }}>
                                  <strong>Valor:</strong> {typeof insight.value === 'object' ? JSON.stringify(insight.value) : String(insight.value)}
                                </div>
                              )}
                              {insight.comparison && (
                                <div className="mt-2 p-2 rounded" style={{ backgroundColor: `${themeColors.gridColor}40` }}>
                                  <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.8 }}>
                                    Comparação:
                                  </p>
                                  <p className="text-xs font-secondary" style={{ color: themeColors.foreground }}>
                                    {formatLabel(insight.comparison.label)}: {typeof insight.comparison.value === 'object' ? JSON.stringify(insight.comparison.value) : String(insight.comparison.value)}
                                  </p>
                                  <p className="text-xs font-secondary" style={{ color: themeColors.foreground }}>
                                    Diferença: {String(insight.comparison.difference)}
                                  </p>
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

              {/* Estatísticas */}
              {analysis.statistics && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3
                      className="w-5 h-5"
                      style={{ color: themeColors.primary }}
                    />
                    <h3
                      className="text-base sm:text-lg font-bold font-primary"
                      style={{ color: themeColors.foreground }}
                    >
                      Estatísticas
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Média
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {formatNumber(analysis.statistics.mean)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Mediana
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {formatNumber(analysis.statistics.median)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Desvio Padrão
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {formatNumber(analysis.statistics.stdDev)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Mínimo
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {formatNumber(analysis.statistics.min)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Máximo
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {formatNumber(analysis.statistics.max)}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.gridColor,
                      }}
                    >
                      <p className="text-xs font-secondary mb-1" style={{ color: themeColors.foreground, opacity: 0.7 }}>
                        Tendência
                      </p>
                      <p className="text-base font-bold font-primary" style={{ color: themeColors.foreground }}>
                        {getTrendLabel(analysis.statistics.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end p-4 sm:p-6 border-t"
          style={{ borderColor: themeColors.gridColor }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-secondary rounded-lg transition-colors"
            style={{
              backgroundColor: themeColors.primary,
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

