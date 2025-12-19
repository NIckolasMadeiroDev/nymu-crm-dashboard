/**
 * Utilitários para cálculos estatísticos
 */

export interface StatisticalSummary {
  mean: number
  median: number
  mode: number | null
  standardDeviation: number
  variance: number
  min: number
  max: number
  range: number
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
  percentiles: {
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
  }
  outliers: number[]
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export function calculateMode(values: number[]): number | null {
  if (values.length === 0) return null
  const frequency: Record<number, number> = {}
  values.forEach((val) => {
    frequency[val] = (frequency[val] || 0) + 1
  })
  const maxFreq = Math.max(...Object.values(frequency))
  const modes = Object.keys(frequency)
    .filter((key) => frequency[Number(key)] === maxFreq)
    .map(Number)
  return modes.length === 1 ? modes[0] : null
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = calculateMean(values)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = calculateMean(values)
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function detectOutliers(values: number[]): number[] {
  if (values.length === 0) return []
  const q1 = calculatePercentile(values, 25)
  const q3 = calculatePercentile(values, 75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  return values.filter((val) => val < lowerBound || val > upperBound)
}

export function calculateStatisticalSummary(values: number[]): StatisticalSummary {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0] || 0
  const max = sorted.at(-1) || 0

  return {
    mean: calculateMean(values),
    median: calculateMedian(values),
    mode: calculateMode(values),
    standardDeviation: calculateStandardDeviation(values),
    variance: calculateVariance(values),
    min,
    max,
    range: max - min,
    quartiles: {
      q1: calculatePercentile(values, 25),
      q2: calculatePercentile(values, 50),
      q3: calculatePercentile(values, 75),
    },
    percentiles: {
      p10: calculatePercentile(values, 10),
      p25: calculatePercentile(values, 25),
      p50: calculatePercentile(values, 50),
      p75: calculatePercentile(values, 75),
      p90: calculatePercentile(values, 90),
      p95: calculatePercentile(values, 95),
      p99: calculatePercentile(values, 99),
    },
    outliers: detectOutliers(values),
  }
}

export function calculateLinearRegression(
  xValues: number[],
  yValues: number[]
): { slope: number; intercept: number; rSquared: number } {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return { slope: 0, intercept: 0, rSquared: 0 }
  }

  const n = xValues.length
  const sumX = xValues.reduce((sum, x) => sum + x, 0)
  const sumY = yValues.reduce((sum, y) => sum + y, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  const ssRes = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept
    return sum + Math.pow(y - predicted, 2)
  }, 0)
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}

export function forecast(
  historicalValues: number[],
  periods: number
): number[] {
  if (historicalValues.length < 2) {
    return new Array(periods).fill(historicalValues[0] || 0)
  }

  const xValues = historicalValues.map((_, i) => i)
  const regression = calculateLinearRegression(xValues, historicalValues)

  const forecasts: number[] = []
  for (let i = 0; i < periods; i++) {
    const nextX = historicalValues.length + i
    forecasts.push(regression.slope * nextX + regression.intercept)
  }

  return forecasts
}

