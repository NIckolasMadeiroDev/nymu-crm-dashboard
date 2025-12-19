import type { DashboardData } from '@/types/dashboard'
import type { ChartConfig, TableConfig } from '@/types/charts'

export type ExportFormat = 'pdf' | 'png' | 'csv' | 'excel' | 'json'

export interface ExportOptions {
  format: ExportFormat
  includeCharts?: boolean
  includeTables?: boolean
  includeKPIs?: boolean
  filename?: string
  title?: string
  sections?: {
    generationActivation?: boolean
    salesConversion?: boolean
    conversionRates?: boolean
    leadStock?: boolean
    salesByConversionTime?: boolean
    leadQuality?: boolean
  }
}

export interface ScheduledReport {
  id: string
  name: string
  schedule: 'daily' | 'weekly' | 'monthly'
  time: string
  recipients: string[]
  format: ExportFormat
  filters?: Record<string, any>
  enabled: boolean
}

class ExportService {
  async exportDashboard(
    data: Partial<DashboardData>,
    options: ExportOptions
  ): Promise<Blob | string> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(data, options)
      case 'png':
        return this.exportToPNG(data, options)
      case 'csv':
        return this.exportToCSV(data, options)
      case 'excel':
        return this.exportToExcel(data, options)
      case 'json':
        return this.exportToJSON(data, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  private async exportToPDF(
    data: Partial<DashboardData>,
    options: ExportOptions
  ): Promise<Blob> {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin
    const lineHeight = 6
    const sectionSpacing = 8

    // Função auxiliar para formatar valores
    const formatCurrency = (value: number): string => {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatNumber = (value: number): string => {
      return value.toLocaleString('pt-BR')
    }

    const formatPercentage = (value: number, decimals: number = 1): string => {
      return `${value.toFixed(decimals)}%`
    }

    // Função auxiliar para adicionar nova página se necessário
    const checkPageBreak = (requiredSpace: number = 15) => {
      if (yPosition + requiredSpace > pageHeight - margin - 15) {
        doc.addPage()
        yPosition = margin
        return true
      }
      return false
    }

    // Função para desenhar linha horizontal
    const drawLine = (color: [number, number, number] = [220, 220, 220], thickness: number = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2])
      doc.setLineWidth(thickness)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 4
    }

    // Função para adicionar cabeçalho de seção
    const addSectionHeader = (title: string, fontSize: number = 16) => {
      checkPageBreak(20)
      yPosition += 5
      doc.setFontSize(fontSize)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, yPosition)
      yPosition += 8
      drawLine([59, 130, 246], 1)
      yPosition += 3
    }

    // Função para adicionar KPI card
    const addKPICard = (label: string, value: string | number, color: [number, number, number] = [59, 130, 246]) => {
      checkPageBreak(15)
      const cardHeight = 12
      doc.setFillColor(color[0], color[1], color[2])
      doc.roundedRect(margin, yPosition - 8, contentWidth, cardHeight, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin + 4, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      const valueStr = String(value)
      const textWidth = doc.getTextWidth(valueStr)
      doc.text(valueStr, pageWidth - margin - 4, yPosition, { align: 'right' })
      yPosition += cardHeight + 3
      doc.setTextColor(0, 0, 0)
    }

    // Função para adicionar tabela
    const addTable = (
      headers: string[],
      rows: string[][],
      columnWidths?: number[],
      headerColor: [number, number, number] = [59, 130, 246]
    ) => {
      if (!rows || rows.length === 0) return

      checkPageBreak(30)
      
      // Calcular larguras das colunas
      const totalSpecifiedWidth = columnWidths ? columnWidths.reduce((sum, w) => sum + w, 0) : 0
      const defaultColumnWidth = totalSpecifiedWidth > 0 
        ? (contentWidth - totalSpecifiedWidth) / (headers.length - columnWidths!.length)
        : contentWidth / headers.length
      
      const widths: number[] = []
      let usedWidth = 0
      headers.forEach((_, index) => {
        if (columnWidths && columnWidths[index]) {
          widths.push(columnWidths[index])
          usedWidth += columnWidths[index]
        } else {
          widths.push(defaultColumnWidth)
        }
      })
      
      // Ajustar se necessário
      const totalWidth = widths.reduce((sum, w) => sum + w, 0)
      if (totalWidth > contentWidth) {
        const ratio = contentWidth / totalWidth
        widths.forEach((w, i) => { widths[i] = w * ratio })
      }

      const rowHeight = 7
      const headerHeight = 9

      // Cabeçalho
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
      doc.rect(margin, yPosition - headerHeight + 2, contentWidth, headerHeight, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      
      let xPos = margin + 3
      headers.forEach((header, index) => {
        const maxHeaderWidth = widths[index] - 6
        let headerText = header
        if (doc.getTextWidth(headerText) > maxHeaderWidth) {
          let truncated = headerText
          while (doc.getTextWidth(truncated + '...') > maxHeaderWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          headerText = truncated + '...'
        }
        doc.text(headerText, xPos, yPosition)
        xPos += widths[index]
      })
      
      yPosition += headerHeight + 2
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)

      // Linhas da tabela
      rows.forEach((row, rowIndex) => {
        checkPageBreak(rowHeight + 3)
        
        // Alternar cor de fundo
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(margin, yPosition - rowHeight + 2, contentWidth, rowHeight, 'F')
        }

        xPos = margin + 3
        row.forEach((cell, cellIndex) => {
          const cellText = String(cell || '-')
          const maxWidth = widths[cellIndex] - 6
          let displayText = cellText
          
          // Truncar texto se muito longo
          if (doc.getTextWidth(cellText) > maxWidth) {
            let truncated = cellText
            while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1)
            }
            displayText = truncated + '...'
          }
          
          doc.text(displayText, xPos, yPosition)
          xPos += widths[cellIndex]
        })
        yPosition += rowHeight
      })
      
      // Linha final da tabela
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 6
    }

    // Cabeçalho principal
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(options.title || 'Dashboard CRM NYMU', pageWidth / 2, 18, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const dateStr = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, 25, { align: 'center' })

    // Informações de filtros - mais detalhadas
    if (data.filters) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const filters: string[] = []
      if (data.filters.date) filters.push(`Data: ${data.filters.date}`)
      if (data.filters.season) filters.push(`Temporada: ${data.filters.season}`)
      if (data.filters.sdr && data.filters.sdr !== 'Todos') filters.push(`SDR: ${data.filters.sdr}`)
      if (data.filters.college && data.filters.college !== 'Todas') filters.push(`Faculdade: ${data.filters.college}`)
      if (data.filters.origin && data.filters.origin !== '') filters.push(`Origem: ${data.filters.origin}`)
      
      const filterText = filters.length > 0 ? filters.join(' | ') : 'Todos os filtros'
      doc.text(filterText, pageWidth / 2, 32, { align: 'center' })
      
      // Linha separadora
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.5)
      doc.line(margin, 35, pageWidth - margin, 35)
    }

    yPosition = 45
    doc.setTextColor(0, 0, 0)

    // 1. GERAÇÃO E ATIVAÇÃO
    if ((options.sections?.generationActivation !== false) && data.generationActivation) {
      addSectionHeader('1. GERAÇÃO E ATIVAÇÃO DE LEADS')

      if (options.includeKPIs !== false) {
        checkPageBreak(20)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)
        doc.text('Indicadores Principais', margin, yPosition)
        yPosition += 10

        addKPICard('Leads Criados', formatNumber(data.generationActivation.leadsCreated), [59, 130, 246])
        addKPICard('Leads no Grupo', formatNumber(data.generationActivation.leadsInGroup), [16, 185, 129])
        addKPICard('Participantes no Meet', formatNumber(data.generationActivation.meetParticipants), [139, 92, 246])
        yPosition += 5
      }

      // Tabela de Leads por Semana
      if (options.includeTables !== false && data.generationActivation.leadsCreatedByWeek && data.generationActivation.leadsCreatedByWeek.length > 0) {
        checkPageBreak(25)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)
        doc.text('Leads Criados por Semana', margin, yPosition)
        yPosition += 8

        const tableHeaders = ['Semana', 'Quantidade', 'Período']
        const tableRows = data.generationActivation.leadsCreatedByWeek.map((week) => [
          `Semana ${week.week}`,
          formatNumber(week.value),
          week.label || '-',
        ])
        addTable(tableHeaders, tableRows, [50, 60, 80])
      }
    }

    // 2. CONVERSÃO DE VENDAS
    if ((options.sections?.salesConversion !== false) && data.salesConversion) {
      addSectionHeader('2. CONVERSÃO DE VENDAS')

      if (options.includeKPIs !== false) {
        checkPageBreak(25)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)
        doc.text('Métricas de Vendas', margin, yPosition)
        yPosition += 10

        addKPICard('Vendas Fechadas', formatNumber(data.salesConversion.closedSales), [239, 68, 68])
        addKPICard('Taxa de Fechamento', formatPercentage(data.salesConversion.closingRate), [16, 185, 129])
        addKPICard('Meta de Taxa', formatPercentage(data.salesConversion.targetRate), [139, 92, 246])
        addKPICard('Receita Gerada', formatCurrency(data.salesConversion.revenueGenerated), [245, 158, 11])
        yPosition += 5
      }

      // Tabela de Vendas por Semana
      if (options.includeTables !== false && data.salesConversion.salesByWeek && data.salesConversion.salesByWeek.length > 0) {
        checkPageBreak(25)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)
        doc.text('Vendas por Semana', margin, yPosition)
        yPosition += 8

        const tableHeaders = ['Semana', 'Vendas', 'Período']
        const tableRows = data.salesConversion.salesByWeek.map((week) => [
          `Semana ${week.week}`,
          formatNumber(week.value),
          week.label || '-',
        ])
        addTable(tableHeaders, tableRows, [50, 60, 80])
      }
    }

    // 3. TAXAS DE CONVERSÃO
    if ((options.sections?.conversionRates !== false) && data.conversionRates) {
      addSectionHeader('3. TAXAS DE CONVERSÃO')

      checkPageBreak(30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('Taxas de Conversão por Etapa', margin, yPosition)
      yPosition += 10

      const rates = [
        {
          label: 'Criado → Grupo',
          current: data.conversionRates.createdToGroup.current,
          target: data.conversionRates.createdToGroup.target,
        },
        {
          label: 'Grupo → Meet',
          current: data.conversionRates.groupToMeet.current,
          target: data.conversionRates.groupToMeet.target,
        },
        {
          label: 'Meet → Venda',
          current: data.conversionRates.meetToSale.current,
          target: data.conversionRates.meetToSale.target,
        },
      ]

      // Criar tabela de taxas
      const ratesHeaders = ['Etapa', 'Taxa Atual', 'Meta', 'Status', 'Progresso']
      const ratesRows = rates.map((rate) => {
        const progress = Math.min(100, (rate.current / rate.target) * 100)
        const status = rate.current >= rate.target ? '✓ Meta Atingida' : '⚠ Abaixo da Meta'
        return [
          rate.label,
          formatPercentage(rate.current),
          formatPercentage(rate.target),
          status,
          formatPercentage(progress),
        ]
      })
      addTable(ratesHeaders, ratesRows, [60, 35, 35, 50, 40])

      // Adicionar barras de progresso visuais
      yPosition += 3
      rates.forEach((rate) => {
        checkPageBreak(15)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(rate.label, margin, yPosition)
        
        // Barra de progresso
        const barWidth = contentWidth - 50
        const barHeight = 6
        const progress = Math.min(100, (rate.current / rate.target) * 100)
        const barFillWidth = (barWidth * progress) / 100
        
        const barY = yPosition - 3
        doc.setFillColor(230, 230, 230)
        doc.rect(margin + 45, barY, barWidth, barHeight, 'F')
        
        // Cor baseada no progresso
        const barColor: [number, number, number] = 
          progress >= 100 ? [16, 185, 129] : 
          progress >= 80 ? [59, 130, 246] : 
          progress >= 50 ? [245, 158, 11] : 
          [239, 68, 68]
        
        doc.setFillColor(barColor[0], barColor[1], barColor[2])
        doc.rect(margin + 45, barY, barFillWidth, barHeight, 'F')
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        doc.text(`${formatPercentage(rate.current)} / ${formatPercentage(rate.target)}`, margin + 45 + barWidth + 5, yPosition)
        yPosition += 12
      })
      yPosition += 5
    }

    // 4. ESTOQUE DE LEADS
    if ((options.sections?.leadStock !== false) && data.leadStock) {
      addSectionHeader('4. ESTOQUE DE LEADS')

      checkPageBreak(30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('Distribuição do Estoque', margin, yPosition)
      yPosition += 10

      const stockItems = [
        { label: 'Lista de Contato', value: data.leadStock.contactList, color: [16, 185, 129] },
        { label: 'Primeiro Contato', value: data.leadStock.firstContact, color: [245, 158, 11] },
        { label: 'No Grupo', value: data.leadStock.inGroup, color: [239, 68, 68] },
        { label: 'Pós-Meet', value: data.leadStock.postMeet, color: [34, 197, 94] },
      ]

      const totalStock = stockItems.reduce((sum, item) => sum + item.value, 0)

      // Tabela de estoque
      const stockHeaders = ['Categoria', 'Quantidade', 'Percentual']
      const stockRows = stockItems.map((item) => {
        const percentage = totalStock > 0 ? ((item.value / totalStock) * 100).toFixed(1) : '0.0'
        return [
          item.label,
          formatNumber(item.value),
          `${percentage}%`,
        ]
      })
      
      // Adicionar total
      stockRows.push([
        'TOTAL',
        formatNumber(totalStock),
        '100.0%',
      ])

      addTable(stockHeaders, stockRows, [80, 60, 50])
    }

    // 5. VENDAS POR TEMPO DE CONVERSÃO
    if ((options.sections?.salesByConversionTime !== false) && data.salesByConversionTime) {
      addSectionHeader('5. VENDAS POR TEMPO DE CONVERSÃO')

      checkPageBreak(30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('Distribuição por Período de Conversão', margin, yPosition)
      yPosition += 10

      const conversionPeriods = [
        { label: '7 Dias', data: data.salesByConversionTime.sevenDays, color: [59, 130, 246] },
        { label: '30 Dias', data: data.salesByConversionTime.thirtyDays, color: [16, 185, 129] },
        { label: '90 Dias', data: data.salesByConversionTime.ninetyDays, color: [239, 68, 68] },
        { label: '180 Dias', data: data.salesByConversionTime.oneEightyDays, color: [245, 158, 11] },
      ]

      conversionPeriods.forEach((period) => {
        if (period.data && period.data.length > 0) {
          checkPageBreak(30)
          
          // Subtítulo do período
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setFillColor(period.color[0], period.color[1], period.color[2])
          doc.rect(margin, yPosition - 6, 4, 6, 'F')
          doc.setTextColor(0, 0, 0)
          doc.text(period.label, margin + 8, yPosition)
          yPosition += 10

          // Tabela do período
          const periodHeaders = ['Dias', 'Vendas']
          const periodRows = period.data.map((point) => [
            `${point.days} dias`,
            formatNumber(point.value),
          ])
          
          // Calcular total
          const periodTotal = period.data.reduce((sum, point) => sum + point.value, 0)
          periodRows.push([
            'TOTAL',
            formatNumber(periodTotal),
          ])

          addTable(periodHeaders, periodRows, [60, 80], period.color)
          yPosition += 3
        }
      })
    }

    // 6. QUALIDADE DOS LEADS
    if ((options.sections?.leadQuality !== false) && (options.includeTables !== false) && data.leadQuality && data.leadQuality.length > 0) {
      addSectionHeader('6. QUALIDADE DOS LEADS')

      checkPageBreak(30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(50, 50, 50)
      doc.text('Análise por Origem', margin, yPosition)
      yPosition += 10

      // Tabela de qualidade
      const qualityHeaders = ['Origem', '% Participação Meet', '% Taxa de Compra', 'Performance Média']
      const qualityRows = data.leadQuality.map((item) => {
        const performance = (item.meetParticipationRate + item.purchaseRate) / 2
        return [
          item.origin,
          formatPercentage(item.meetParticipationRate),
          formatPercentage(item.purchaseRate),
          formatPercentage(performance),
        ]
      })

      addTable(qualityHeaders, qualityRows, [60, 50, 50, 50])

      // Adicionar indicadores visuais de performance
      yPosition += 3
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Legenda: ', margin, yPosition)
      doc.setFillColor(16, 185, 129)
      doc.circle(margin + 20, yPosition - 1, 2, 'F')
      doc.text('Alta (≥50%)', margin + 25, yPosition)
      doc.setFillColor(245, 158, 11)
      doc.circle(margin + 60, yPosition - 1, 2, 'F')
      doc.text('Média (30-49%)', margin + 65, yPosition)
      doc.setFillColor(239, 68, 68)
      doc.circle(margin + 110, yPosition - 1, 2, 'F')
      doc.text('Baixa (<30%)', margin + 115, yPosition)
      yPosition += 8
    }

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      
      // Linha do rodapé
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${i} de ${totalPages}`,
        margin,
        pageHeight - 8
      )
      doc.text(
        `Dashboard CRM NYMU - ${new Date().getFullYear()}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      )
    }

    return doc.output('blob')
  }

  private async exportToPNG(
    data: Partial<DashboardData>,
    options: ExportOptions
  ): Promise<Blob> {
    const html2canvas = (await import('html2canvas')).default
    const element = document.getElementById('dashboard-export-container')
    
    if (!element) {
      throw new Error('Dashboard container not found')
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          throw new Error('Failed to create PNG blob')
        }
      }, 'image/png')
    })
  }

  private exportToCSV(data: Partial<DashboardData>, options: ExportOptions): string {
    const rows: string[] = []

    if (options.includeKPIs) {
      rows.push('Métrica,Valor')
      if (data.generationActivation) {
        rows.push(`Leads Criados,${data.generationActivation.leadsCreated}`)
        rows.push(`Leads no Grupo,${data.generationActivation.leadsInGroup}`)
        rows.push(
          `Participantes no Meet,${data.generationActivation.meetParticipants}`
        )
      }
      if (data.salesConversion) {
        rows.push(`Vendas Fechadas,${data.salesConversion.closedSales}`)
        rows.push(
          `Receita Gerada,${data.salesConversion.revenueGenerated}`
        )
      }
      rows.push('')
    }

    if (options.includeTables && data.leadQuality) {
      rows.push('Origem,% Entraram no Meet,% Compraram')
      data.leadQuality.forEach((item) => {
        rows.push(
          `${item.origin},${item.meetParticipationRate},${item.purchaseRate}`
        )
      })
    }

    return rows.join('\n')
  }

  private async exportToExcel(data: Partial<DashboardData>, options: ExportOptions): Promise<Blob> {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()

    // 1. RESUMO EXECUTIVO
    const summaryData: any[][] = [
      ['DASHBOARD CRM NYMU - RESUMO EXECUTIVO'],
      [''],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [''],
    ]

    if (data.filters) {
      summaryData.push(['FILTROS APLICADOS'])
      if (data.filters.date) summaryData.push(['Data:', data.filters.date])
      if (data.filters.season) summaryData.push(['Temporada:', data.filters.season])
      if (data.filters.sdr) summaryData.push(['SDR:', data.filters.sdr])
      if (data.filters.college) summaryData.push(['Faculdade:', data.filters.college])
      if (data.filters.origin) summaryData.push(['Origem:', data.filters.origin])
      summaryData.push([''])
    }

    if (options.includeKPIs) {
      summaryData.push(['INDICADORES PRINCIPAIS'])
      if (data.generationActivation) {
        summaryData.push(['Leads Criados', data.generationActivation.leadsCreated])
        summaryData.push(['Leads no Grupo', data.generationActivation.leadsInGroup])
        summaryData.push(['Participantes no Meet', data.generationActivation.meetParticipants])
      }
      if (data.salesConversion) {
        summaryData.push(['Vendas Fechadas', data.salesConversion.closedSales])
        summaryData.push(['Taxa de Fechamento', `${data.salesConversion.closingRate.toFixed(1)}%`])
        summaryData.push(['Receita Gerada', `R$ ${data.salesConversion.revenueGenerated.toLocaleString('pt-BR')}`])
      }
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

    // 2. GERAÇÃO E ATIVAÇÃO
    if (options.sections?.generationActivation !== false && data.generationActivation) {
      const genData: any[][] = [
        ['GERAÇÃO E ATIVAÇÃO DE LEADS'],
        [''],
        ['Indicadores Principais'],
        ['Leads Criados', data.generationActivation.leadsCreated],
        ['Leads no Grupo', data.generationActivation.leadsInGroup],
        ['Participantes no Meet', data.generationActivation.meetParticipants],
        [''],
      ]

      if (data.generationActivation.leadsCreatedByWeek && data.generationActivation.leadsCreatedByWeek.length > 0) {
        genData.push(['LEADS CRIADOS POR SEMANA'])
        genData.push(['Semana', 'Valor', 'Label'])
        data.generationActivation.leadsCreatedByWeek.forEach((week) => {
          genData.push([week.week, week.value, week.label])
        })
      }

      const genSheet = XLSX.utils.aoa_to_sheet(genData)
      XLSX.utils.book_append_sheet(workbook, genSheet, 'Geração e Ativação')
    }

    // 3. CONVERSÃO DE VENDAS
    if (options.sections?.salesConversion !== false && data.salesConversion) {
      const salesData: any[][] = [
        ['CONVERSÃO DE VENDAS'],
        [''],
        ['Métricas de Vendas'],
        ['Vendas Fechadas', data.salesConversion.closedSales],
        ['Taxa de Fechamento', `${data.salesConversion.closingRate.toFixed(1)}%`],
        ['Meta de Taxa', `${data.salesConversion.targetRate.toFixed(1)}%`],
        ['Receita Gerada', `R$ ${data.salesConversion.revenueGenerated.toLocaleString('pt-BR')}`],
        [''],
      ]

      if (data.salesConversion.salesByWeek && data.salesConversion.salesByWeek.length > 0) {
        salesData.push(['VENDAS POR SEMANA'])
        salesData.push(['Semana', 'Vendas', 'Label'])
        data.salesConversion.salesByWeek.forEach((week) => {
          salesData.push([week.week, week.value, week.label])
        })
      }

      const salesSheet = XLSX.utils.aoa_to_sheet(salesData)
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Conversão de Vendas')
    }

    // 4. TAXAS DE CONVERSÃO
    if (options.sections?.conversionRates !== false && data.conversionRates) {
      const ratesData: any[][] = [
        ['TAXAS DE CONVERSÃO'],
        [''],
        ['Taxa', 'Atual (%)', 'Meta (%)', 'Status'],
      ]

      const rates = [
        {
          label: 'Criado → Grupo',
          current: data.conversionRates.createdToGroup.current,
          target: data.conversionRates.createdToGroup.target,
        },
        {
          label: 'Grupo → Meet',
          current: data.conversionRates.groupToMeet.current,
          target: data.conversionRates.groupToMeet.target,
        },
        {
          label: 'Meet → Venda',
          current: data.conversionRates.meetToSale.current,
          target: data.conversionRates.meetToSale.target,
        },
      ]

      rates.forEach((rate) => {
        const status = rate.current >= rate.target ? '✓ Meta Atingida' : '⚠ Abaixo da Meta'
        ratesData.push([rate.label, `${rate.current.toFixed(1)}%`, `${rate.target.toFixed(1)}%`, status])
      })

      const ratesSheet = XLSX.utils.aoa_to_sheet(ratesData)
      XLSX.utils.book_append_sheet(workbook, ratesSheet, 'Taxas de Conversão')
    }

    // 5. ESTOQUE DE LEADS
    if (options.sections?.leadStock !== false && data.leadStock) {
      const stockData: any[][] = [
        ['ESTOQUE DE LEADS'],
        [''],
        ['Categoria', 'Quantidade'],
        ['Lista de Contato', data.leadStock.contactList],
        ['Primeiro Contato', data.leadStock.firstContact],
        ['No Grupo', data.leadStock.inGroup],
        ['Pós-Meet', data.leadStock.postMeet],
        [''],
        ['TOTAL', data.leadStock.contactList + data.leadStock.firstContact + data.leadStock.inGroup + data.leadStock.postMeet],
      ]

      const stockSheet = XLSX.utils.aoa_to_sheet(stockData)
      XLSX.utils.book_append_sheet(workbook, stockSheet, 'Estoque de Leads')
    }

    // 6. VENDAS POR TEMPO DE CONVERSÃO
    if (options.sections?.salesByConversionTime !== false && data.salesByConversionTime) {
      const conversionData: any[][] = [
        ['VENDAS POR TEMPO DE CONVERSÃO'],
        [''],
      ]

      const periods = [
        { label: '7 Dias', data: data.salesByConversionTime.sevenDays },
        { label: '30 Dias', data: data.salesByConversionTime.thirtyDays },
        { label: '90 Dias', data: data.salesByConversionTime.ninetyDays },
        { label: '180 Dias', data: data.salesByConversionTime.oneEightyDays },
      ]

      periods.forEach((period) => {
        if (period.data && period.data.length > 0) {
          conversionData.push([`${period.label}`])
          conversionData.push(['Dias', 'Vendas'])
          period.data.forEach((point) => {
            conversionData.push([`${point.days}d`, point.value])
          })
          conversionData.push([''])
        }
      })

      const conversionSheet = XLSX.utils.aoa_to_sheet(conversionData)
      XLSX.utils.book_append_sheet(workbook, conversionSheet, 'Tempo de Conversão')
    }

    // 7. QUALIDADE DOS LEADS
    if (options.sections?.leadQuality !== false && options.includeTables && data.leadQuality) {
      const qualityData: any[][] = [
        ['QUALIDADE DOS LEADS'],
        [''],
        ['Origem', '% Entraram no Meet', '% Compraram', 'Performance Média'],
      ]

      data.leadQuality.forEach((item) => {
        const performance = ((item.meetParticipationRate + item.purchaseRate) / 2).toFixed(1)
        qualityData.push([
          item.origin,
          `${item.meetParticipationRate.toFixed(1)}%`,
          `${item.purchaseRate.toFixed(1)}%`,
          `${performance}%`,
        ])
      })

      const qualitySheet = XLSX.utils.aoa_to_sheet(qualityData)
      XLSX.utils.book_append_sheet(workbook, qualitySheet, 'Qualidade dos Leads')
    }

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  private exportToJSON(data: Partial<DashboardData>, options: ExportOptions): string {
    return JSON.stringify(data, null, 2)
  }

  downloadFile(blob: Blob | string, filename: string, mimeType?: string) {
    if (typeof blob === 'string') {
      const url = `data:${mimeType || 'application/json'};charset=utf-8,${encodeURIComponent(blob)}`
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}

export const exportService = new ExportService()
