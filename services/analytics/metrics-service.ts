/**
 * Serviço para métricas derivadas e compostas
 */

import type { DashboardData } from '@/types/dashboard'
import { calculateMean, calculateMedian, calculateStandardDeviation } from '@/utils/statistics'
import { calculateAllPeriodComparisons } from '@/utils/period-comparison'

export interface DerivedMetric {
  id: string
  name: string
  value: number
  formula: string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  changePercent?: number
}

export interface CompositeMetric {
  id: string
  name: string
  value: number
  components: Array<{ name: string; weight: number; value: number }>
  formula: string
}

export class MetricsService {
  /**
   * Calcula métricas derivadas a partir dos dados do dashboard
   */
  calculateDerivedMetrics(data: DashboardData): DerivedMetric[] {
    const metrics: DerivedMetric[] = []

    // Taxa de Conversão Total (Leads Criados → Vendas Fechadas)
    if (data.generationActivation && data.salesConversion) {
      const totalConversionRate =
        data.generationActivation.leadsCreated > 0
          ? (data.salesConversion.closedSales / data.generationActivation.leadsCreated) * 100
          : 0

      metrics.push({
        id: 'total-conversion-rate',
        name: 'Taxa de Conversão Total',
        value: totalConversionRate,
        formula: '(Vendas Fechadas / Leads Criados) * 100',
        unit: '%',
      })
    }

    // Ticket Médio
    if (data.salesConversion) {
      const averageTicket =
        data.salesConversion.closedSales > 0
          ? data.salesConversion.revenueGenerated / data.salesConversion.closedSales
          : 0

      metrics.push({
        id: 'average-ticket',
        name: 'Ticket Médio',
        value: averageTicket,
        formula: 'Receita Gerada / Vendas Fechadas',
        unit: 'R$',
      })
    }

    // Taxa de Ativação (Leads no Grupo / Leads Criados)
    if (data.generationActivation) {
      const activationRate =
        data.generationActivation.leadsCreated > 0
          ? (data.generationActivation.leadsInGroup / data.generationActivation.leadsCreated) * 100
          : 0

      metrics.push({
        id: 'activation-rate',
        name: 'Taxa de Ativação',
        value: activationRate,
        formula: '(Leads no Grupo / Leads Criados) * 100',
        unit: '%',
      })
    }

    // Taxa de Engajamento (Participantes no Meet / Leads no Grupo)
    if (data.generationActivation) {
      const engagementRate =
        data.generationActivation.leadsInGroup > 0
          ? (data.generationActivation.meetParticipants / data.generationActivation.leadsInGroup) * 100
          : 0

      metrics.push({
        id: 'engagement-rate',
        name: 'Taxa de Engajamento',
        value: engagementRate,
        formula: '(Participantes no Meet / Leads no Grupo) * 100',
        unit: '%',
      })
    }

    // ROI Estimado (Receita / Leads Criados)
    if (data.generationActivation && data.salesConversion) {
      const estimatedROI =
        data.generationActivation.leadsCreated > 0
          ? data.salesConversion.revenueGenerated / data.generationActivation.leadsCreated
          : 0

      metrics.push({
        id: 'estimated-roi',
        name: 'ROI Estimado por Lead',
        value: estimatedROI,
        formula: 'Receita Gerada / Leads Criados',
        unit: 'R$',
      })
    }

    return metrics
  }

  /**
   * Calcula métricas compostas (combinação de múltiplas métricas)
   */
  calculateCompositeMetrics(data: DashboardData): CompositeMetric[] {
    const metrics: CompositeMetric[] = []

    // Score de Performance Geral
    if (data.conversionRates && data.salesConversion) {
      const createdToGroupScore = (data.conversionRates.createdToGroup.current / data.conversionRates.createdToGroup.target) * 100
      const groupToMeetScore = (data.conversionRates.groupToMeet.current / data.conversionRates.groupToMeet.target) * 100
      const meetToSaleScore = (data.conversionRates.meetToSale.current / data.conversionRates.meetToSale.target) * 100
      const closingRateScore = (data.salesConversion.closingRate / data.salesConversion.targetRate) * 100

      const overallScore = (createdToGroupScore + groupToMeetScore + meetToSaleScore + closingRateScore) / 4

      metrics.push({
        id: 'overall-performance-score',
        name: 'Score de Performance Geral',
        value: overallScore,
        components: [
          { name: 'Criado → Grupo', weight: 25, value: createdToGroupScore },
          { name: 'Grupo → Meet', weight: 25, value: groupToMeetScore },
          { name: 'Meet → Venda', weight: 25, value: meetToSaleScore },
          { name: 'Taxa de Fechamento', weight: 25, value: closingRateScore },
        ],
        formula: 'Média ponderada das taxas de conversão',
      })
    }

    // Score de Qualidade de Leads
    if (data.leadQuality && data.leadQuality.length > 0) {
      const avgMeetRate = calculateMean(data.leadQuality.map((lq) => lq.meetParticipationRate))
      const avgPurchaseRate = calculateMean(data.leadQuality.map((lq) => lq.purchaseRate))
      const qualityScore = (avgMeetRate + avgPurchaseRate) / 2

      metrics.push({
        id: 'lead-quality-score',
        name: 'Score de Qualidade de Leads',
        value: qualityScore,
        components: [
          { name: 'Taxa Média de Participação no Meet', weight: 50, value: avgMeetRate },
          { name: 'Taxa Média de Compra', weight: 50, value: avgPurchaseRate },
        ],
        formula: '(Taxa Média Meet + Taxa Média Compra) / 2',
      })
    }

    return metrics
  }

  /**
   * Calcula comparações período a período para séries temporais
   */
  calculatePeriodComparisons(data: DashboardData) {
    const comparisons: Record<string, any> = {}

    // Comparações para Leads Criados por Semana
    if (data.generationActivation?.leadsCreatedByWeek) {
      const weeklyData = data.generationActivation.leadsCreatedByWeek.map((week) => ({
        date: new Date(), // Simplificado - em produção usar data real
        value: week.value,
      }))

      comparisons.leadsCreated = calculateAllPeriodComparisons(weeklyData)
    }

    // Comparações para Vendas por Semana
    if (data.salesConversion?.salesByWeek) {
      const weeklyData = data.salesConversion.salesByWeek.map((week) => ({
        date: new Date(), // Simplificado - em produção usar data real
        value: week.value,
      }))

      comparisons.sales = calculateAllPeriodComparisons(weeklyData)
    }

    return comparisons
  }

  /**
   * Calcula estatísticas descritivas para uma série de valores
   */
  calculateDescriptiveStatistics(values: number[]) {
    if (values.length === 0) {
      return {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        min: 0,
        max: 0,
        range: 0,
      }
    }

    return {
      mean: calculateMean(values),
      median: calculateMedian(values),
      standardDeviation: calculateStandardDeviation(values),
      min: Math.min(...values),
      max: Math.max(...values),
      range: Math.max(...values) - Math.min(...values),
    }
  }
}

export const metricsService = new MetricsService()

