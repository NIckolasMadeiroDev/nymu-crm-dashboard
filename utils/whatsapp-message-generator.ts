import type { DashboardFilters } from '@/types/dashboard'

export function generateWhatsAppMessage(
  filename: string,
  format: string,
  filters?: DashboardFilters
): string {
  const formatNames: Record<string, string> = {
    pdf: 'PDF',
    png: 'PNG',
    csv: 'CSV',
    excel: 'Excel',
    xlsx: 'Excel',
  }

  const formatName = formatNames[format.toLowerCase()] || format.toUpperCase()

  let message = `📊 *Dashboard CRM NYMU*\n\n`
  message += `📄 *Arquivo:* ${filename}.${format}\n`
  message += `📋 *Formato:* ${formatName}\n\n`

  if (filters) {
    message += `🔍 *Filtros Aplicados:*\n`

    if (filters.date) {
      message += `📅 Data: ${filters.date}\n`
    }

    if (filters.sdr && filters.sdr !== 'Todos') {
      message += `👤 SDR: ${filters.sdr}\n`
    }

    if (filters.college && filters.college !== 'Todas') {
      message += `🏫 Faculdade: ${filters.college}\n`
    }

    if (filters.origin && filters.origin !== '') {
      message += `📍 Origem: ${filters.origin}\n`
    }

    message += `\n`
  }

  message += `📈 Relatório gerado automaticamente pelo Dashboard CRM NYMU.\n`
  message += `\n`
  message += `_Gerado em ${new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}_`

  return message
}

