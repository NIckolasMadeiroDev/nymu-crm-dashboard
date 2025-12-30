
export const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export const DEFAULT_SCATTER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const getColorByIndex = (index: number, colors: string[] = DEFAULT_COLORS): string => {
  return colors[index % colors.length]
}

export const formatBoxplotLabel = (name: string | undefined): string => {
  const labels: Record<string, string> = {
    min: 'Mínimo',
    q1: 'Q1 (25%)',
    median: 'Mediana',
    q3: 'Q3 (75%)',
    max: 'Máximo',
    mean: 'Média',
  }
  return labels[name || ''] || name || ''
}

