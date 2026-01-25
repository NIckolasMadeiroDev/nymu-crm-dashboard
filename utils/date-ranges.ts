export function getWeekDateRange(weekNumber: number): { startDate: Date; endDate: Date } {
  const now = Date.now()
  
  const weeksAgo = 12 - weekNumber
  
  const weekEndMs = now - (weeksAgo * 7 * 24 * 60 * 60 * 1000)
  
  const weekStartMs = weekEndMs - (7 * 24 * 60 * 60 * 1000) + 1
  
  const endDate = new Date(weekEndMs)
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date(weekStartMs)
  startDate.setHours(0, 0, 0, 0)
  
  return {
    startDate,
    endDate,
  }
}

export function getDaysDateRange(days: number): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)
  
  return {
    startDate,
    endDate,
  }
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const startFormatted = startDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  
  const endFormatted = endDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  
  return `${startFormatted} até ${endFormatted}`
}

