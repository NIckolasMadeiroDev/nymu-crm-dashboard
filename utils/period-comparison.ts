/**
 * Utilitários para comparações período a período (WoW, MoM, YoY)
 */

import { subWeeks, subMonths, subYears, isAfter, isBefore } from 'date-fns'

export interface PeriodComparison {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export type ComparisonType = 'WoW' | 'MoM' | 'YoY'

export interface TimeSeriesPoint {
  date: Date | string
  value: number
}

/**
 * Função auxiliar para calcular comparação de períodos
 */
function calculatePeriodComparison(
  currentData: TimeSeriesPoint[],
  previousData: TimeSeriesPoint[]
): PeriodComparison {
  const currentSum = currentData.reduce((sum, point) => sum + point.value, 0)
  const previousSum = previousData.reduce((sum, point) => sum + point.value, 0)
  const change = currentSum - previousSum
  const changePercent = previousSum === 0 ? 0 : (change / previousSum) * 100

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (changePercent > 5) {
    trend = 'up'
  } else if (changePercent < -5) {
    trend = 'down'
  }

  return {
    current: currentSum,
    previous: previousSum,
    change,
    changePercent,
    trend,
  }
}

/**
 * Compara valores semana a semana (Week over Week)
 */
export function compareWeekOverWeek(
  currentData: TimeSeriesPoint[],
  previousData: TimeSeriesPoint[]
): PeriodComparison {
  return calculatePeriodComparison(currentData, previousData)
}

/**
 * Compara valores mês a mês (Month over Month)
 */
export function compareMonthOverMonth(
  currentData: TimeSeriesPoint[],
  previousData: TimeSeriesPoint[]
): PeriodComparison {
  return calculatePeriodComparison(currentData, previousData)
}

/**
 * Compara valores ano a ano (Year over Year)
 */
export function compareYearOverYear(
  currentData: TimeSeriesPoint[],
  previousData: TimeSeriesPoint[]
): PeriodComparison {
  return calculatePeriodComparison(currentData, previousData)
}

/**
 * Filtra dados por período relativo
 */
export function filterDataByPeriod(
  data: TimeSeriesPoint[],
  period: ComparisonType,
  referenceDate: Date = new Date()
): TimeSeriesPoint[] {
  let startDate: Date

  switch (period) {
    case 'WoW':
      startDate = subWeeks(referenceDate, 1)
      break
    case 'MoM':
      startDate = subMonths(referenceDate, 1)
      break
    case 'YoY':
      startDate = subYears(referenceDate, 1)
      break
  }

  return data.filter((point) => {
    const pointDate = typeof point.date === 'string' ? new Date(point.date) : point.date
    return isAfter(pointDate, startDate) && isBefore(pointDate, referenceDate)
  })
}

/**
 * Calcula todas as comparações período a período
 */
export function calculateAllPeriodComparisons(
  data: TimeSeriesPoint[],
  referenceDate: Date = new Date()
): {
  wow: PeriodComparison
  mom: PeriodComparison
  yoy: PeriodComparison
} {
  const currentWeek = filterDataByPeriod(data, 'WoW', referenceDate)
  const previousWeek = filterDataByPeriod(data, 'WoW', subWeeks(referenceDate, 1))

  const currentMonth = filterDataByPeriod(data, 'MoM', referenceDate)
  const previousMonth = filterDataByPeriod(data, 'MoM', subMonths(referenceDate, 1))

  const currentYear = filterDataByPeriod(data, 'YoY', referenceDate)
  const previousYear = filterDataByPeriod(data, 'YoY', subYears(referenceDate, 1))

  return {
    wow: compareWeekOverWeek(currentWeek, previousWeek),
    mom: compareMonthOverMonth(currentMonth, previousMonth),
    yoy: compareYearOverYear(currentYear, previousYear),
  }
}

