import { formatNumber, formatCurrency } from '@/utils/format-currency'

export const formatValue = (value: number, format?: 'number' | 'currency' | 'percentage'): string => {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    default:
      return formatNumber(value)
  }
}

