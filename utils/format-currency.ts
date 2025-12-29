export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export interface AdaptiveFormatResult {
  value: number
  unit: string
  formatted: string
  scale: number
}

/**
 * Formata números de forma adaptativa para valores muito altos
 * Escala automaticamente para milhares (K), milhões (M), bilhões (B)
 */
export function formatAdaptiveNumber(value: number): AdaptiveFormatResult {
  if (value === 0) {
    return {
      value: 0,
      unit: '',
      formatted: '0',
      scale: 1,
    }
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? -1 : 1

  if (absValue >= 1_000_000_000) {
    const scaled = (value / 1_000_000_000)
    return {
      value: scaled,
      unit: 'B',
      formatted: `${scaled.toFixed(absValue >= 10_000_000_000 ? 0 : 1)}B`,
      scale: 1_000_000_000,
    }
  }

  if (absValue >= 1_000_000) {
    const scaled = (value / 1_000_000)
    return {
      value: scaled,
      unit: 'M',
      formatted: `${scaled.toFixed(absValue >= 10_000_000 ? 0 : 1)}M`,
      scale: 1_000_000,
    }
  }

  if (absValue >= 1_000) {
    const scaled = (value / 1_000)
    return {
      value: scaled,
      unit: 'K',
      formatted: `${scaled.toFixed(absValue >= 10_000 ? 0 : 1)}K`,
      scale: 1_000,
    }
  }

  return {
    value,
    unit: '',
    formatted: formatNumber(value),
    scale: 1,
  }
}

/**
 * Formata valores para exibição em gráficos, adaptando automaticamente para valores altos
 */
export function formatChartValue(value: number, useAdaptive: boolean = true): string {
  if (!useAdaptive) {
    return formatNumber(value)
  }

  const adaptive = formatAdaptiveNumber(value)
  return adaptive.formatted
}

/**
 * Formata valores monetários de forma adaptativa
 */
export function formatAdaptiveCurrency(value: number): AdaptiveFormatResult {
  if (value === 0) {
    return {
      value: 0,
      unit: '',
      formatted: 'R$ 0,00',
      scale: 1,
    }
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? -1 : 1

  if (absValue >= 1_000_000_000) {
    const scaled = (value / 1_000_000_000)
    return {
      value: scaled,
      unit: 'B',
      formatted: `R$ ${scaled.toFixed(absValue >= 10_000_000_000 ? 0 : 1)}B`,
      scale: 1_000_000_000,
    }
  }

  if (absValue >= 1_000_000) {
    const scaled = (value / 1_000_000)
    return {
      value: scaled,
      unit: 'M',
      formatted: `R$ ${scaled.toFixed(absValue >= 10_000_000 ? 0 : 1)}M`,
      scale: 1_000_000,
    }
  }

  if (absValue >= 1_000) {
    const scaled = (value / 1_000)
    return {
      value: scaled,
      unit: 'K',
      formatted: `R$ ${scaled.toFixed(absValue >= 10_000 ? 0 : 1)}K`,
      scale: 1_000,
    }
  }

  return {
    value,
    unit: '',
    formatted: formatCurrency(value),
    scale: 1,
  }
}

