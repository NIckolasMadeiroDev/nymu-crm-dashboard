import type { DashboardData, TimeSeriesData } from '@/types/dashboard'

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

interface PDFContext {
  doc: any
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
  yPosition: { value: number }
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

    const context = {
      doc,
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      yPosition: { value: margin },
    }

    this.addPDFHeader(context, options, data)
    context.yPosition.value = 45
    doc.setTextColor(0, 0, 0)

    if ((options.sections?.generationActivation !== false) && data.generationActivation) {
      this.addGenerationActivationSection(context, data, options)
    }

    if ((options.sections?.salesConversion !== false) && data.salesConversion) {
      this.addSalesConversionSection(context, data, options)
    }

    if ((options.sections?.conversionRates !== false) && data.conversionRates) {
      this.addConversionRatesSection(context, data)
    }

    if ((options.sections?.leadStock !== false) && data.leadStock) {
      this.addLeadStockSection(context, data)
    }

    if ((options.sections?.salesByConversionTime !== false) && data.salesByConversionTime) {
      this.addSalesByConversionTimeSection(context, data)
    }

    if ((options.sections?.leadQuality !== false) && (options.includeTables !== false) && data.leadQuality && data.leadQuality.length > 0) {
      this.addLeadQualitySection(context, data)
    }

    this.addPDFFooter(context)

    return doc.output('blob')
  }

  private addPDFHeader(
    context: PDFContext,
    options: ExportOptions,
    data: Partial<DashboardData>
  ): void {
    this.addPDFHeaderBackground(context)
    this.addPDFHeaderTitle(context, options.title)
    this.addPDFHeaderDate(context)
    
    if (data.filters) {
      this.addFiltersToHeader(context, data.filters)
    }
  }

  private addPDFHeaderBackground(context: PDFContext): void {
    const { doc, pageWidth } = context
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')
  }

  private addPDFHeaderTitle(context: PDFContext, title?: string): void {
    const { doc, pageWidth } = context
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(title || 'Dashboard CRM NYMU', pageWidth / 2, 18, { align: 'center' })
  }

  private addPDFHeaderDate(context: PDFContext): void {
    const { doc, pageWidth } = context
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
  }

  private addFiltersToHeader(
    context: PDFContext,
    filters: NonNullable<Partial<DashboardData>['filters']>
  ): void {
    const { doc, pageWidth, margin } = context
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const filterTexts: string[] = []
    
    if (filters.date) filterTexts.push(`Data: ${filters.date}`)
    if (filters.sdr && filters.sdr !== 'Todos') filterTexts.push(`SDR: ${filters.sdr}`)
    if (filters.college && filters.college !== 'Todas') filterTexts.push(`Faculdade: ${filters.college}`)
    if (filters.origin && filters.origin !== '') filterTexts.push(`Origem: ${filters.origin}`)
    
    const filterText = filterTexts.length > 0 ? filterTexts.join(' | ') : 'Todos os filtros'
    doc.text(filterText, pageWidth / 2, 32, { align: 'center' })
    
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.5)
    doc.line(margin, 35, pageWidth - margin, 35)
  }

  private addPDFFooter(context: PDFContext): void {
    const { doc, pageWidth, pageHeight, margin } = context
    const totalPages = doc.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      
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
  }

  private addGenerationActivationSection(
    context: PDFContext,
    data: Partial<DashboardData>,
    options: ExportOptions
  ): void {
    if (!data.generationActivation) return

    this.addSectionHeader(context, '1. GERAÇÃO E ATIVAÇÃO DE LEADS')

    if (options.includeKPIs !== false) {
      this.addKPISubsection(context, 'Indicadores Principais', [
        { label: 'Leads Criados', value: this.formatNumber(data.generationActivation.leadsCreated), color: [59, 130, 246] },
        { label: 'Leads no Grupo', value: this.formatNumber(data.generationActivation.leadsInGroup), color: [16, 185, 129] },
        { label: 'Participantes no Meet', value: this.formatNumber(data.generationActivation.meetParticipants), color: [139, 92, 246] },
      ])
    }

    if (options.includeTables !== false && data.generationActivation.leadsCreatedByWeek && data.generationActivation.leadsCreatedByWeek.length > 0) {
      this.addTableSubsection(context, 'Leads Criados por Semana', ['Semana', 'Quantidade', 'Período'], 
        data.generationActivation.leadsCreatedByWeek.map((week) => [
          `Semana ${week.week}`,
          this.formatNumber(week.value),
          week.label || '-',
        ]),
        [50, 60, 80]
      )
    }
  }

  private addSalesConversionSection(
    context: PDFContext,
    data: Partial<DashboardData>,
    options: ExportOptions
  ): void {
    if (!data.salesConversion) return

    this.addSectionHeader(context, '2. CONVERSÃO DE VENDAS')

    if (options.includeKPIs !== false) {
      this.addKPISubsection(context, 'Métricas de Vendas', [
        { label: 'Vendas Fechadas', value: this.formatNumber(data.salesConversion.closedSales), color: [239, 68, 68] },
        { label: 'Taxa de Fechamento', value: this.formatPercentage(data.salesConversion.closingRate), color: [16, 185, 129] },
        { label: 'Meta de Taxa', value: this.formatPercentage(data.salesConversion.targetRate), color: [139, 92, 246] },
        { label: 'Receita Gerada', value: this.formatCurrency(data.salesConversion.revenueGenerated), color: [245, 158, 11] },
      ])
    }

    if (options.includeTables !== false && data.salesConversion.salesByWeek && data.salesConversion.salesByWeek.length > 0) {
      this.addTableSubsection(context, 'Vendas por Semana', ['Semana', 'Vendas', 'Período'],
        data.salesConversion.salesByWeek.map((week) => [
          `Semana ${week.week}`,
          this.formatNumber(week.value),
          week.label || '-',
        ]),
        [50, 60, 80]
      )
    }
  }

  private addConversionRatesSection(
    context: PDFContext,
    data: Partial<DashboardData>
  ): void {
    if (!data.conversionRates) return

    this.addSectionHeader(context, '3. TAXAS DE CONVERSÃO')

    this.checkPageBreak(context, 30)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Taxas de Conversão por Etapa', margin, yPosition.value)
    yPosition.value += 10

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

    const ratesHeaders = ['Etapa', 'Taxa Atual', 'Meta', 'Status', 'Progresso']
    const ratesRows = rates.map((rate) => {
      const progress = Math.min(100, (rate.current / rate.target) * 100)
      const status = rate.current >= rate.target ? '✓ Meta Atingida' : '⚠ Abaixo da Meta'
      return [
        rate.label,
        this.formatPercentage(rate.current),
        this.formatPercentage(rate.target),
        status,
        this.formatPercentage(progress),
      ]
    })
    this.addTable(context, ratesHeaders, ratesRows, [60, 35, 35, 50, 40])

    yPosition.value += 3
    rates.forEach((rate) => {
      this.addProgressBar(context, rate.label, rate.current, rate.target)
    })
    yPosition.value += 5
  }

  private addLeadStockSection(
    context: PDFContext,
    data: Partial<DashboardData>
  ): void {
    if (!data.leadStock) return

    this.addSectionHeader(context, '4. ESTOQUE DE LEADS')

    this.checkPageBreak(context, 30)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Distribuição do Estoque', margin, yPosition.value)
    yPosition.value += 10

    const stockItems = [
      { label: 'Lista de Contato', value: data.leadStock.contactList, color: [16, 185, 129] },
      { label: 'Primeiro Contato', value: data.leadStock.firstContact, color: [245, 158, 11] },
      { label: 'No Grupo', value: data.leadStock.inGroup, color: [239, 68, 68] },
      { label: 'Pós-Meet', value: data.leadStock.postMeet, color: [34, 197, 94] },
    ]

    const totalStock = stockItems.reduce((sum, item) => sum + item.value, 0)

    const stockHeaders = ['Categoria', 'Quantidade', 'Percentual']
    const stockRows = stockItems.map((item) => {
      const percentage = totalStock > 0 ? ((item.value / totalStock) * 100).toFixed(1) : '0.0'
      return [
        item.label,
        this.formatNumber(item.value),
        `${percentage}%`,
      ]
    })
    
    stockRows.push([
      'TOTAL',
      this.formatNumber(totalStock),
      '100.0%',
    ])

    this.addTable(context, stockHeaders, stockRows, [80, 60, 50])
  }

  private addSalesByConversionTimeSection(
    context: PDFContext,
    data: Partial<DashboardData>
  ): void {
    if (!data.salesByConversionTime) return

    this.addSectionHeader(context, '5. VENDAS POR TEMPO DE CONVERSÃO')

    this.checkPageBreak(context, 30)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Distribuição por Período de Conversão', margin, yPosition.value)
    yPosition.value += 10

    const conversionPeriods: Array<{
      label: string
      data: TimeSeriesData[]
      color: [number, number, number]
    }> = [
      { label: '7 Dias', data: data.salesByConversionTime.sevenDays, color: [59, 130, 246] as [number, number, number] },
      { label: '30 Dias', data: data.salesByConversionTime.thirtyDays, color: [16, 185, 129] as [number, number, number] },
      { label: '90 Dias', data: data.salesByConversionTime.ninetyDays, color: [239, 68, 68] as [number, number, number] },
      { label: '180 Dias', data: data.salesByConversionTime.oneEightyDays, color: [245, 158, 11] as [number, number, number] },
    ]

    conversionPeriods.forEach((period) => {
      if (period.data && period.data.length > 0) {
        this.addConversionPeriodTable(context, period)
      }
    })
  }

  private addLeadQualitySection(
    context: PDFContext,
    data: Partial<DashboardData>
  ): void {
    if (!data.leadQuality || data.leadQuality.length === 0) return

    this.addSectionHeader(context, '6. QUALIDADE DOS LEADS')

    this.checkPageBreak(context, 30)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Análise por Origem', margin, yPosition.value)
    yPosition.value += 10

    const qualityHeaders = ['Grupo/Categoria', 'Total de Leads', '% do Total']
    const qualityRows = data.leadQuality.map((item) => {
      return [
        item.origin,
        item.totalLeads.toString(),
        this.formatPercentage(item.percentageOfTotal),
      ]
    })

    this.addTable(context, qualityHeaders, qualityRows, [60, 50, 50, 50])
    this.addQualityLegend(context)
  }

  private addConversionPeriodTable(
    context: PDFContext,
    period: { label: string; data: TimeSeriesData[]; color: [number, number, number] }
  ): void {
    const { doc, margin, yPosition } = context
    this.checkPageBreak(context, 30)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(period.color[0], period.color[1], period.color[2])
    doc.rect(margin, yPosition.value - 6, 4, 6, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(period.label, margin + 8, yPosition.value)
    yPosition.value += 10

    const periodHeaders = ['Dias', 'Vendas']
    const periodRows = period.data.map((point: TimeSeriesData) => [
      `${point.days} dias`,
      this.formatNumber(point.value),
    ])
    
    const periodTotal = period.data.reduce((sum: number, point: TimeSeriesData) => sum + point.value, 0)
    periodRows.push([
      'TOTAL',
      this.formatNumber(periodTotal),
    ])

    this.addTable(context, periodHeaders, periodRows, [60, 80], period.color)
    yPosition.value += 3
  }

  private addQualityLegend(context: PDFContext): void {
    const { doc, margin, yPosition } = context
    yPosition.value += 3
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Legenda: ', margin, yPosition.value)
    doc.setFillColor(16, 185, 129)
    doc.circle(margin + 20, yPosition.value - 1, 2, 'F')
    doc.text('Alta (≥50%)', margin + 25, yPosition.value)
    doc.setFillColor(245, 158, 11)
    doc.circle(margin + 60, yPosition.value - 1, 2, 'F')
    doc.text('Média (30-49%)', margin + 65, yPosition.value)
    doc.setFillColor(239, 68, 68)
    doc.circle(margin + 110, yPosition.value - 1, 2, 'F')
    doc.text('Baixa (<30%)', margin + 115, yPosition.value)
    yPosition.value += 8
  }

  private addProgressBar(
    context: PDFContext,
    label: string,
    current: number,
    target: number
  ): void {
    const { doc, margin, contentWidth, yPosition } = context
    this.checkPageBreak(context, 15)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(label, margin, yPosition.value)
    
    const barWidth = contentWidth - 50
    const barHeight = 6
    const progress = Math.min(100, (current / target) * 100)
    const barFillWidth = (barWidth * progress) / 100
    
    const barY = yPosition.value - 3
    doc.setFillColor(230, 230, 230)
    doc.rect(margin + 45, barY, barWidth, barHeight, 'F')
    
    let barColor: [number, number, number]
    if (progress >= 100) {
      barColor = [16, 185, 129]
    } else if (progress >= 80) {
      barColor = [59, 130, 246]
    } else if (progress >= 50) {
      barColor = [245, 158, 11]
    } else {
      barColor = [239, 68, 68]
    }
    
    doc.setFillColor(barColor[0], barColor[1], barColor[2])
    doc.rect(margin + 45, barY, barFillWidth, barHeight, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(`${this.formatPercentage(current)} / ${this.formatPercentage(target)}`, margin + 45 + barWidth + 5, yPosition.value)
    yPosition.value += 12
  }

  private addKPISubsection(
    context: PDFContext,
    title: string,
    kpis: Array<{ label: string; value: string; color: [number, number, number] }>
  ): void {
    this.checkPageBreak(context, 20)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(title, margin, yPosition.value)
    yPosition.value += 10

    kpis.forEach((kpi) => {
      this.addKPICard(context, kpi.label, kpi.value, kpi.color)
    })
    yPosition.value += 5
  }

  private addTableSubsection(
    context: PDFContext,
    title: string,
    headers: string[],
    rows: string[][],
    columnWidths?: number[]
  ): void {
    this.checkPageBreak(context, 25)
    const { doc, margin, yPosition } = context
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(title, margin, yPosition.value)
    yPosition.value += 8

    this.addTable(context, headers, rows, columnWidths)
  }

  private addSectionHeader(context: PDFContext, title: string, fontSize: number = 16): void {
    this.checkPageBreak(context, 20)
    const { doc, margin, yPosition } = context
    yPosition.value += 5
    doc.setFontSize(fontSize)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, yPosition.value)
    yPosition.value += 8
    this.drawLine(context, [59, 130, 246], 1)
    yPosition.value += 3
  }

  private addKPICard(
    context: PDFContext,
    label: string,
    value: string | number,
    color: [number, number, number] = [59, 130, 246]
  ): void {
    this.checkPageBreak(context, 15)
    const { doc, margin, pageWidth, contentWidth, yPosition } = context
    const cardHeight = 12
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(margin, yPosition.value - 8, contentWidth, cardHeight, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(label, margin + 4, yPosition.value)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    const valueStr = String(value)
    doc.text(valueStr, pageWidth - margin - 4, yPosition.value, { align: 'right' })
    yPosition.value += cardHeight + 3
    doc.setTextColor(0, 0, 0)
  }

  private addTable(
    context: PDFContext,
    headers: string[],
    rows: string[][],
    columnWidths?: number[],
    headerColor: [number, number, number] = [59, 130, 246]
  ): void {
    if (!rows || rows.length === 0) return

    this.checkPageBreak(context, 30)
    const { doc, margin, pageWidth, contentWidth, yPosition } = context
    
    const totalSpecifiedWidth = columnWidths?.reduce((sum, w) => sum + w, 0) ?? 0
    const defaultColumnWidth = totalSpecifiedWidth > 0 
      ? (contentWidth - totalSpecifiedWidth) / (headers.length - (columnWidths?.length ?? 0))
      : contentWidth / headers.length
    
    const widths: number[] = []
    headers.forEach((_, index) => {
      if (columnWidths?.[index]) {
        widths.push(columnWidths[index])
      } else {
        widths.push(defaultColumnWidth)
      }
    })
    
    const totalWidth = widths.reduce((sum, w) => sum + w, 0)
    if (totalWidth > contentWidth) {
      const ratio = contentWidth / totalWidth
      widths.forEach((w, i) => { widths[i] = w * ratio })
    }

    const rowHeight = 7
    const headerHeight = 9

    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.rect(margin, yPosition.value - headerHeight + 2, contentWidth, headerHeight, 'F')
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
      doc.text(headerText, xPos, yPosition.value)
      xPos += widths[index]
    })
    
    yPosition.value += headerHeight + 2
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(context, rowHeight + 3)
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, yPosition.value - rowHeight + 2, contentWidth, rowHeight, 'F')
      }

      xPos = margin + 3
      row.forEach((cell, cellIndex) => {
        const cellText = String(cell || '-')
        const maxWidth = widths[cellIndex] - 6
        let displayText = cellText
        
        if (doc.getTextWidth(cellText) > maxWidth) {
          let truncated = cellText
          while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1)
          }
          displayText = truncated + '...'
        }
        
        doc.text(displayText, xPos, yPosition.value)
        xPos += widths[cellIndex]
      })
      yPosition.value += rowHeight
    })
    
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition.value, pageWidth - margin, yPosition.value)
    yPosition.value += 6
  }

  private checkPageBreak(context: PDFContext, requiredSpace: number = 15): boolean {
    const { doc, pageHeight, margin, yPosition } = context
    if (yPosition.value + requiredSpace > pageHeight - margin - 15) {
      doc.addPage()
      yPosition.value = margin
      return true
    }
    return false
  }

  private drawLine(
    context: PDFContext,
    color: [number, number, number] = [220, 220, 220],
    thickness: number = 0.5
  ): void {
    const { doc, margin, pageWidth, yPosition } = context
    doc.setDrawColor(color[0], color[1], color[2])
    doc.setLineWidth(thickness)
    doc.line(margin, yPosition.value, pageWidth - margin, yPosition.value)
    yPosition.value += 4
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('pt-BR')
  }

  private formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
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
        rows.push(
          `Leads Criados,${data.generationActivation.leadsCreated}`,
          `Leads no Grupo,${data.generationActivation.leadsInGroup}`,
          `Participantes no Meet,${data.generationActivation.meetParticipants}`
        )
      }
      if (data.salesConversion) {
        rows.push(
          `Vendas Fechadas,${data.salesConversion.closedSales}`,
          `Receita Gerada,${data.salesConversion.revenueGenerated}`
        )
      }
      rows.push('')
    }

    if (options.includeTables && data.leadQuality) {
      rows.push('Grupo/Categoria,Total de Leads,% do Total')
      data.leadQuality.forEach((item) => {
        rows.push(
          `${item.origin},${item.totalLeads},${item.percentageOfTotal}`
        )
      })
    }

    return rows.join('\n')
  }

  private async exportToExcel(data: Partial<DashboardData>, options: ExportOptions): Promise<Blob> {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()

    this.addExcelSummarySheet(workbook, data, options, XLSX)
    this.addExcelGenerationActivationSheet(workbook, data, options, XLSX)
    this.addExcelSalesConversionSheet(workbook, data, options, XLSX)
    this.addExcelConversionRatesSheet(workbook, data, options, XLSX)
    this.addExcelLeadStockSheet(workbook, data, options, XLSX)
    this.addExcelSalesByConversionTimeSheet(workbook, data, options, XLSX)
    this.addExcelLeadQualitySheet(workbook, data, options, XLSX)

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  private addExcelSummarySheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    const summaryData: any[][] = [
      ['DASHBOARD CRM NYMU - RESUMO EXECUTIVO'],
      [''],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [''],
    ]

    if (data.filters) {
      const filterRows = this.buildExcelFilterRows(data.filters)
      summaryData.push(...filterRows)
    }

    if (options.includeKPIs) {
      const kpiRows = this.buildExcelKpiRows(data)
      summaryData.push(...kpiRows)
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')
  }

  private buildExcelFilterRows(filters: NonNullable<Partial<DashboardData>['filters']>): any[][] {
    const filterRows: any[][] = [['FILTROS APLICADOS']]
    if (filters.date) filterRows.push(['Data:', filters.date])
    if (filters.sdr) filterRows.push(['SDR:', filters.sdr])
    if (filters.college) filterRows.push(['Faculdade:', filters.college])
    if (filters.origin) filterRows.push(['Origem:', filters.origin])
    filterRows.push([''])
    return filterRows
  }

  private buildExcelKpiRows(data: Partial<DashboardData>): any[][] {
    const kpiRows: any[][] = [['INDICADORES PRINCIPAIS']]
    if (data.generationActivation) {
      kpiRows.push(
        ['Leads Criados', data.generationActivation.leadsCreated],
        ['Leads no Grupo', data.generationActivation.leadsInGroup],
        ['Participantes no Meet', data.generationActivation.meetParticipants]
      )
    }
    if (data.salesConversion) {
      kpiRows.push(
        ['Vendas Fechadas', data.salesConversion.closedSales],
        ['Taxa de Fechamento', `${data.salesConversion.closingRate.toFixed(1)}%`],
        ['Receita Gerada', `R$ ${data.salesConversion.revenueGenerated.toLocaleString('pt-BR')}`]
      )
    }
    return kpiRows
  }

  private addExcelGenerationActivationSheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.generationActivation === false || !data.generationActivation) return

    const genData: any[][] = [
      ['GERAÇÃO E ATIVAÇÃO DE LEADS'],
      [''],
      ['Indicadores Principais'],
      ['Leads Criados', data.generationActivation.leadsCreated],
      ['Leads no Grupo', data.generationActivation.leadsInGroup],
      ['Participantes no Meet', data.generationActivation.meetParticipants],
      [''],
    ]

    if (data.generationActivation.leadsCreatedByWeek?.length) {
      const weekRows: any[][] = [
        ['LEADS CRIADOS POR SEMANA'],
        ['Semana', 'Valor', 'Label'],
        ...data.generationActivation.leadsCreatedByWeek.map((week) => [week.week, week.value, week.label])
      ]
      genData.push(...weekRows)
    }

    const genSheet = XLSX.utils.aoa_to_sheet(genData)
    XLSX.utils.book_append_sheet(workbook, genSheet, 'Geração e Ativação')
  }

  private addExcelSalesConversionSheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.salesConversion === false || !data.salesConversion) return

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

    if (data.salesConversion.salesByWeek?.length) {
      const weekRows: any[][] = [
        ['VENDAS POR SEMANA'],
        ['Semana', 'Vendas', 'Label'],
        ...data.salesConversion.salesByWeek.map((week) => [week.week, week.value, week.label])
      ]
      salesData.push(...weekRows)
    }

    const salesSheet = XLSX.utils.aoa_to_sheet(salesData)
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Conversão de Vendas')
  }

  private addExcelConversionRatesSheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.conversionRates === false || !data.conversionRates) return

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

  private addExcelLeadStockSheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.leadStock === false || !data.leadStock) return

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

  private addExcelSalesByConversionTimeSheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.salesByConversionTime === false || !data.salesByConversionTime) return

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
      if (period.data?.length) {
        const periodRows: any[][] = [
          [`${period.label}`],
          ['Dias', 'Vendas'],
          ...period.data.map((point) => [`${point.days}d`, point.value]),
          ['']
        ]
        conversionData.push(...periodRows)
      }
    })

    const conversionSheet = XLSX.utils.aoa_to_sheet(conversionData)
    XLSX.utils.book_append_sheet(workbook, conversionSheet, 'Tempo de Conversão')
  }

  private addExcelLeadQualitySheet(workbook: any, data: Partial<DashboardData>, options: ExportOptions, XLSX: any): void {
    if (options.sections?.leadQuality === false || !options.includeTables || !data.leadQuality) return

    const qualityData: any[][] = [
      ['QUALIDADE DOS LEADS'],
      [''],
      ['Grupo/Categoria', 'Total de Leads', '% do Total'],
    ]

    data.leadQuality.forEach((item) => {
      qualityData.push([
        item.origin,
        item.totalLeads.toString(),
        `${item.percentageOfTotal.toFixed(1)}%`,
      ])
    })

    const qualitySheet = XLSX.utils.aoa_to_sheet(qualityData)
    XLSX.utils.book_append_sheet(workbook, qualitySheet, 'Qualidade dos Leads')
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
      link.remove()
    } else {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }
  }
}

export const exportService = new ExportService()
