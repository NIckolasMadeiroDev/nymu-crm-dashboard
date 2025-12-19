export const ARIA_LABELS = {
  dashboard: {
    main: 'Dashboard principal do CRM',
    filters: 'Filtros do dashboard',
    charts: 'Gráficos e visualizações',
    tables: 'Tabelas de dados',
    kpis: 'Indicadores principais de desempenho',
  },
  filters: {
    date: 'Filtro de data',
    season: 'Filtro de temporada',
    sdr: 'Filtro de SDR',
    college: 'Filtro de faculdade',
    origin: 'Filtro de origem',
  },
  charts: {
    export: 'Exportar gráfico',
    drillDown: 'Ver detalhes do gráfico',
    dataPoint: 'Ponto de dados',
  },
  buttons: {
    export: 'Exportar dados',
    share: 'Compartilhar dashboard',
    schedule: 'Agendar relatório',
    close: 'Fechar',
    reset: 'Redefinir',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
}

export function handleKeyDown(
  event: React.KeyboardEvent,
  action: () => void,
  keys: string[] = ['Enter', ' ']
) {
  if (keys.includes(event.key)) {
    event.preventDefault()
    action()
  }
}

export function getAriaLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  return {
    role: 'status' as const,
    'aria-live': priority,
    'aria-atomic': true,
  }
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(selectors))
}

export function trapFocus(container: HTMLElement) {
  const focusableElements = getFocusableElements(container)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else if (document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }

  container.addEventListener('keydown', handleTab)
  firstElement?.focus()

  return () => {
    container.removeEventListener('keydown', handleTab)
  }
}

