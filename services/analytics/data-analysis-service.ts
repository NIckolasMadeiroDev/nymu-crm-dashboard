export interface Anomaly {
  type: 'spike' | 'drop' | 'outlier' | 'trend_change'
  severity: 'low' | 'medium' | 'high'
  value: number
  index: number
  label?: string | Record<string, unknown>
  description: string
  previousValue?: number
  percentageChange?: number
}

export interface Insight {
  type: 'comparison' | 'trend' | 'statistical' | 'performance'
  title: string
  description: string
  value?: number | string | Record<string, unknown>
  comparison?: {
    label: string | Record<string, unknown>
    value: number | string | Record<string, unknown>
    difference: number | string
  }
  significance: 'low' | 'medium' | 'high'
}

export interface DataAnalysisResult {
  anomalies: Anomaly[]
  insights: Insight[]
  statistics: {
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}

class DataAnalysisService {
  /**
   * Detecta anomalias em séries temporais
   */
  detectAnomalies(
    data: Array<{ value: number; label?: string; [key: string]: any }>,
    threshold: number = 2.0
  ): Anomaly[] {
    if (!data || data.length < 3) return []

    const values = data.map((d) => d.value)
    const mean = this.calculateMean(values)
    const stdDev = this.calculateStdDev(values, mean)

    const anomalies: Anomaly[] = []

    // Detectar outliers usando Z-score
    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > threshold) {
        const previousValue = index > 0 ? values[index - 1] : undefined
        const percentageChange = previousValue
          ? ((value - previousValue) / previousValue) * 100
          : undefined

        const label = data[index]?.label
        anomalies.push({
          type: value > mean ? 'spike' : 'drop',
          severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
          value,
          index,
          label: label !== undefined && label !== null ? label : undefined,
          description: this.generateAnomalyDescription(value, mean, stdDev, zScore, previousValue),
          previousValue,
          percentageChange,
        })
      }
    })

    // Detectar mudanças de tendência
    if (values.length >= 5) {
      const trendChanges = this.detectTrendChanges(values, data)
      anomalies.push(...trendChanges)
    }

    return anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * Gera insights explicativos sobre os dados
   */
  generateInsights(
    data: Array<{ value: number; label?: string; [key: string]: any }>,
    previousData?: Array<{ value: number; label?: string; [key: string]: any }>
  ): Insight[] {
    if (!data || data.length === 0) return []

    const values = data.map((d) => d.value)
    const statistics = this.calculateStatistics(values)

    const insights: Insight[] = []

    // Insight de tendência geral
    insights.push({
      type: 'trend',
      title: 'Tendência Geral',
      description: this.generateTrendDescription(statistics.trend, statistics.mean),
      significance: 'medium',
    })

    // Insight de comparação com período anterior
    if (previousData && previousData.length > 0) {
      const previousValues = previousData.map((d) => d.value)
      const previousMean = this.calculateMean(previousValues)
      const currentMean = statistics.mean
      const change = ((currentMean - previousMean) / previousMean) * 100

      insights.push({
        type: 'comparison',
        title: 'Comparação com Período Anterior',
        description: this.generateComparisonDescription(change, currentMean, previousMean),
        value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        comparison: {
          label: 'Período Anterior',
          value: previousMean.toLocaleString('pt-BR'),
          difference: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        },
        significance: Math.abs(change) > 10 ? 'high' : Math.abs(change) > 5 ? 'medium' : 'low',
      })
    }

    // Insight de melhor/pior desempenho
    const maxIndex = values.indexOf(statistics.max)
    const minIndex = values.indexOf(statistics.min)

    if (maxIndex !== minIndex) {
      const maxLabel = data[maxIndex]?.label
      const maxLabelStr = this.formatLabelForDescription(maxLabel)
      insights.push({
        type: 'performance',
        title: 'Maior Valor',
        description: `O maior valor registrado foi ${statistics.max.toLocaleString('pt-BR')}${maxLabelStr ? ` em ${maxLabelStr}` : ''}, representando ${((statistics.max / statistics.mean) * 100).toFixed(1)}% acima da média.`,
        value: statistics.max.toLocaleString('pt-BR'),
        significance: statistics.max > statistics.mean * 1.5 ? 'high' : 'medium',
      })

      const minLabel = data[minIndex]?.label
      const minLabelStr = this.formatLabelForDescription(minLabel)
      insights.push({
        type: 'performance',
        title: 'Menor Valor',
        description: `O menor valor registrado foi ${statistics.min.toLocaleString('pt-BR')}${minLabelStr ? ` em ${minLabelStr}` : ''}, representando ${((statistics.min / statistics.mean) * 100).toFixed(1)}% da média.`,
        value: statistics.min.toLocaleString('pt-BR'),
        significance: statistics.min < statistics.mean * 0.5 ? 'high' : 'medium',
      })
    }

    // Insight estatístico
    const coefficientOfVariation = (statistics.stdDev / statistics.mean) * 100
    insights.push({
      type: 'statistical',
      title: 'Variabilidade dos Dados',
      description: this.generateVariabilityDescription(coefficientOfVariation, statistics.stdDev),
      value: `${coefficientOfVariation.toFixed(1)}%`,
      significance: coefficientOfVariation > 30 ? 'high' : coefficientOfVariation > 15 ? 'medium' : 'low',
    })

    return insights.sort((a, b) => {
      const significanceOrder = { high: 3, medium: 2, low: 1 }
      return significanceOrder[b.significance] - significanceOrder[a.significance]
    })
  }

  /**
   * Analisa dados e retorna resultado completo
   */
  analyzeData(
    data: Array<{ value: number; label?: string; [key: string]: any }>,
    previousData?: Array<{ value: number; label?: string; [key: string]: any }>
  ): DataAnalysisResult {
    const values = data.map((d) => d.value)
    const anomalies = this.detectAnomalies(data)
    const insights = this.generateInsights(data, previousData)
    const statistics = this.calculateStatistics(values)

    return {
      anomalies,
      insights,
      statistics,
    }
  }

  // Métodos auxiliares privados

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(avgSquaredDiff)
  }

  private calculateStatistics(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b)
    const mean = this.calculateMean(values)
    const stdDev = this.calculateStdDev(values, mean)
    const median = this.calculateMedian(sorted)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Determinar tendência
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstHalfMean = this.calculateMean(firstHalf)
    const secondHalfMean = this.calculateMean(secondHalf)
    const change = ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(change) < 5) {
      trend = 'stable'
    } else if (change > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    return { mean, median, stdDev, min, max, trend }
  }

  private calculateMedian(sorted: number[]): number {
    if (sorted.length === 0) return 0
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  private detectTrendChanges(
    values: number[],
    data: Array<{ value: number; label?: string; [key: string]: any }>
  ): Anomaly[] {
    const anomalies: Anomaly[] = []
    const windowSize = 3

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const beforeWindow = values.slice(i - windowSize, i)
      const afterWindow = values.slice(i + 1, i + 1 + windowSize)

      const beforeMean = this.calculateMean(beforeWindow)
      const afterMean = this.calculateMean(afterWindow)

      const change = ((afterMean - beforeMean) / beforeMean) * 100

      if (Math.abs(change) > 20) {
        const label = data[i]?.label
        anomalies.push({
          type: 'trend_change',
          severity: Math.abs(change) > 40 ? 'high' : 'medium',
          value: values[i],
          index: i,
          label: label !== undefined && label !== null ? label : undefined,
          description: `Mudança significativa de tendência detectada: ${change > 0 ? 'aumento' : 'queda'} de ${Math.abs(change).toFixed(1)}% após este ponto.`,
          previousValue: beforeMean,
          percentageChange: change,
        })
      }
    }

    return anomalies
  }

  private generateAnomalyDescription(
    value: number,
    mean: number,
    stdDev: number,
    zScore: number,
    previousValue?: number
  ): string {
    const deviation = ((value - mean) / mean) * 100
    let description = `Valor ${value > mean ? 'acima' : 'abaixo'} da média em ${Math.abs(deviation).toFixed(1)}%`

    if (previousValue !== undefined) {
      const change = ((value - previousValue) / previousValue) * 100
      description += `, representando uma ${change > 0 ? 'alta' : 'queda'} de ${Math.abs(change).toFixed(1)}% em relação ao valor anterior.`
    } else {
      description += `. Z-score de ${zScore.toFixed(2)} indica um ${zScore > 3 ? 'desvio extremo' : 'desvio significativo'} da distribuição normal.`
    }

    return description
  }

  private generateTrendDescription(trend: 'increasing' | 'decreasing' | 'stable', mean: number): string {
    switch (trend) {
      case 'increasing':
        return `Os dados mostram uma tendência de crescimento, com média de ${mean.toLocaleString('pt-BR')}. Os valores estão aumentando ao longo do período analisado.`
      case 'decreasing':
        return `Os dados mostram uma tendência de declínio, com média de ${mean.toLocaleString('pt-BR')}. Os valores estão diminuindo ao longo do período analisado.`
      case 'stable':
        return `Os dados mostram uma tendência estável, com média de ${mean.toLocaleString('pt-BR')}. Os valores permanecem relativamente constantes ao longo do período.`
    }
  }

  private generateComparisonDescription(change: number, currentMean: number, previousMean: number): string {
    if (Math.abs(change) < 1) {
      return `Os valores permaneceram praticamente estáveis em relação ao período anterior (média atual: ${currentMean.toLocaleString('pt-BR')}, anterior: ${previousMean.toLocaleString('pt-BR')}).`
    }

    const direction = change > 0 ? 'aumento' : 'redução'
    const magnitude = Math.abs(change) > 20 ? 'significativo' : Math.abs(change) > 10 ? 'moderado' : 'pequeno'

    return `Observa-se um ${magnitude} ${direction} de ${Math.abs(change).toFixed(1)}% em relação ao período anterior. A média atual é ${currentMean.toLocaleString('pt-BR')}, comparada a ${previousMean.toLocaleString('pt-BR')} do período anterior.`
  }

  private generateVariabilityDescription(coefficientOfVariation: number, stdDev: number): string {
    if (coefficientOfVariation < 10) {
      return `Os dados apresentam baixa variabilidade (CV: ${coefficientOfVariation.toFixed(1)}%), indicando valores consistentes e previsíveis. Desvio padrão de ${stdDev.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}.`
    } else if (coefficientOfVariation < 25) {
      return `Os dados apresentam variabilidade moderada (CV: ${coefficientOfVariation.toFixed(1)}%), com alguma dispersão em torno da média. Desvio padrão de ${stdDev.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}.`
    } else {
      return `Os dados apresentam alta variabilidade (CV: ${coefficientOfVariation.toFixed(1)}%), indicando grande dispersão e possível necessidade de investigação. Desvio padrão de ${stdDev.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}.`
    }
  }

  private formatLabelForDescription(label: string | Record<string, unknown> | undefined): string {
    if (!label) return ''
    if (typeof label === 'string') return label
    
    // Format object with readable key-value pairs
    const keys = Object.keys(label)
    if (keys.length === 0) return ''
    
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
    
    const formattedPairs: string[] = []
    for (const key of keys) {
      const value = label[key]
      if (value !== undefined && value !== null) {
        const formattedKey = keyTranslations[key] || key
        const formattedValue = typeof value === 'number' 
          ? value.toLocaleString('pt-BR')
          : String(value)
        formattedPairs.push(`${formattedKey}: ${formattedValue}`)
      }
    }
    
    return formattedPairs.length > 0 ? formattedPairs.join(', ') : ''
  }
}

export const dataAnalysisService = new DataAnalysisService()

