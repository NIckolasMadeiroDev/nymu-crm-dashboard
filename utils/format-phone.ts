/**
 * Formata número de telefone brasileiro
 * Exemplos:
 * - 85988912614 -> (85) 98891-2614
 * - +5585988912614 -> (85) 98891-2614
 * - 85|988912614 -> (85) 98891-2614
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-'

  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')

  // Remove código do país se presente (55)
  const withoutCountryCode = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned

  // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (withoutCountryCode.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 7)}-${withoutCountryCode.slice(7)}`
  } else if (withoutCountryCode.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 6)}-${withoutCountryCode.slice(6)}`
  }

  // Se não conseguir formatar, retorna o original
  return phone
}

/**
 * Máscara de telefone para input
 */
export function maskPhoneInput(value: string): string {
  const cleaned = value.replaceAll(/\D/g, '')
  
  if (cleaned.length <= 2) {
    return cleaned
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  } else if (cleaned.length <= 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}

