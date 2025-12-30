/**
 * Calcula o range de datas para uma semana relativa
 * Usa a mesma lógica do dashboard: semanas relativas a partir de hoje
 * @param weekNumber Número da semana (1 = esta semana, 2 = semana passada, etc.)
 * @returns Objeto com startDate e endDate
 */
export function getWeekDateRange(weekNumber: number): { startDate: Date; endDate: Date } {
  const now = Date.now()
  
  // Semana 1 = esta semana (0 semanas atrás)
  // Semana 2 = semana passada (1 semana atrás)
  // Semana 3 = 2 semanas atrás
  const weeksAgo = weekNumber - 1
  
  // Calcular o fim da semana (hoje - semanas atrás * 7 dias)
  const weekEndMs = now - (weeksAgo * 7 * 24 * 60 * 60 * 1000)
  
  // Calcular o início da semana (7 dias antes do fim)
  const weekStartMs = weekEndMs - (7 * 24 * 60 * 60 * 1000) + 1 // +1ms para incluir o primeiro dia
  
  // Criar datas
  const endDate = new Date(weekEndMs)
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date(weekStartMs)
  startDate.setHours(0, 0, 0, 0)
  
  return {
    startDate,
    endDate,
  }
}

/**
 * Calcula o range de datas para um período de dias
 * @param days Número de dias
 * @returns Objeto com startDate e endDate
 */
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

/**
 * Formata um range de datas para exibição
 */
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

