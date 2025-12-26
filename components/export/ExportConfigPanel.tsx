'use client'

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import type { ExportFormat } from '@/services/export/export-service'
import type { DashboardData } from '@/types/dashboard'
import { exportService } from '@/services/export/export-service'
import WhatsAppPreviewModal from './WhatsAppPreviewModal'
import { generateWhatsAppMessage } from '@/utils/whatsapp-message-generator'

interface ExportConfigPanelProps {
  readonly data: DashboardData
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onExport: () => void
}

interface ExportConfig {
  format: ExportFormat
  sections: {
    generationActivation: boolean
    salesConversion: boolean
    conversionRates: boolean
    leadStock: boolean
    salesByConversionTime: boolean
    leadQuality: boolean
  }
  includeCharts: boolean
  includeTables: boolean
  includeKPIs: boolean
  title: string
  filename: string
  sendToWhatsApp: boolean
  filters: {
    dateRange?: { start: string; end: string }
    sdr?: string[]
    college?: string[]
    origin?: string[]
  }
}

const DEFAULT_CONFIG: ExportConfig = {
  format: 'pdf',
  sections: {
    generationActivation: true,
    salesConversion: true,
    conversionRates: true,
    leadStock: true,
    salesByConversionTime: true,
    leadQuality: true,
  },
  includeCharts: true,
  includeTables: true,
  includeKPIs: true,
  title: 'Dashboard CRM NYMU',
  filename: `dashboard-${new Date().toISOString().split('T')[0]}`,
  sendToWhatsApp: false,
  filters: {},
}

const FILE_FORMATS = new Set<ExportFormat>(['pdf', 'png', 'csv', 'excel'])

export default function ExportConfigPanel({
  data,
  isOpen,
  onClose,
  onExport,
}: Readonly<ExportConfigPanelProps>) {
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_CONFIG)
  const [isExporting, setIsExporting] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [exportedFile, setExportedFile] = useState<{ blob: Blob; filename: string } | null>(null)

  const filteredData = useMemo(() => {
    if (!config.filters || Object.keys(config.filters).length === 0) {
      return data
    }

    let filtered = { ...data }

    if (config.filters.origin && config.filters.origin.length > 0) {
      filtered.leadQuality = filtered.leadQuality.filter((item) =>
        config.filters.origin?.includes(item.origin)
      )
    }

    return filtered
  }, [data, config.filters])

  const handleExport = async () => {
    try {
      setIsExporting(true)

      const exportData: Partial<DashboardData> = {
        filters: filteredData.filters,
      }

      if (config.sections.generationActivation) {
        exportData.generationActivation = filteredData.generationActivation
      }
      if (config.sections.salesConversion) {
        exportData.salesConversion = filteredData.salesConversion
      }
      if (config.sections.conversionRates) {
        exportData.conversionRates = filteredData.conversionRates
      }
      if (config.sections.leadStock) {
        exportData.leadStock = filteredData.leadStock
      }
      if (config.sections.salesByConversionTime) {
        exportData.salesByConversionTime = filteredData.salesByConversionTime
      }
      if (config.sections.leadQuality) {
        exportData.leadQuality = filteredData.leadQuality
      }

      const result = await exportService.exportDashboard(exportData, {
        format: config.format,
        includeCharts: config.includeCharts,
        includeTables: config.includeTables,
        includeKPIs: config.includeKPIs,
        title: config.title,
        filename: config.filename,
        sections: config.sections,
      })

      const extension = config.format === 'excel' ? 'xlsx' : config.format
      const mimeTypes: Record<ExportFormat, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json',
      }

      const filename = `${config.filename}.${extension}`

      // Se WhatsApp está habilitado e o formato gera arquivo
      if (config.sendToWhatsApp && FILE_FORMATS.has(config.format) && result instanceof Blob) {
        setExportedFile({ blob: result, filename })
        setShowWhatsAppModal(true)
        setIsExporting(false)
        return
      }

      exportService.downloadFile(result, filename, mimeTypes[config.format])
      onExport()
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Erro ao exportar. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleWhatsAppConfirm = (message: string) => {
    if (!exportedFile) return

    const encodedMessage = encodeURIComponent(message)

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?text=${encodedMessage}`
    
    try {
      window.open(whatsappUrl, '_blank')
    } catch {
      navigator.clipboard.writeText(message).then(() => {
        toast.success('Mensagem copiada para a área de transferência!')
      })
    }

    const mimeTypes: Record<ExportFormat, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json',
    }
    
    exportService.downloadFile(exportedFile.blob, exportedFile.filename, mimeTypes[config.format])

    toast.success(
      isMobile
        ? 'Arquivo baixado. Anexe o arquivo no WhatsApp e cole a mensagem.'
        : 'Arquivo baixado. Abra o WhatsApp Web e anexe o arquivo junto com a mensagem.',
      { duration: 5000 }
    )
    
    setShowWhatsAppModal(false)
    setExportedFile(null)
    onExport()
    onClose()
  }

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const toggleSection = (section: keyof ExportConfig['sections']) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section],
      },
    }))
  }

  const toggleAllSections = () => {
    const allSelected = Object.values(config.sections).every(Boolean)
    setConfig((prev) => ({
      ...prev,
      sections: {
        generationActivation: !allSelected,
        salesConversion: !allSelected,
        conversionRates: !allSelected,
        leadStock: !allSelected,
        salesByConversionTime: !allSelected,
        leadQuality: !allSelected,
      },
    }))
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open={isOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 w-full max-w-full bg-transparent"
        aria-modal="true"
        aria-labelledby="export-config-title"
        onCancel={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-2 sm:mx-4"
          onClick={(e) => e.stopPropagation()}
          aria-label="Configurações de exportação"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <h2
              id="export-config-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 truncate flex-1 min-w-0"
            >
              Configurações de Exportação
            </h2>
            <button
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClose()
                }
              }}
              aria-label="Fechar painel de configurações"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="export-format-select" className="block text-sm font-medium font-secondary text-gray-700 mb-2">
                Formato
              </label>
              <select
                id="export-format-select"
                value={config.format}
                onChange={(e) => updateConfig({ format: e.target.value as ExportFormat })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-secondary"
                aria-label="Selecionar formato de exportação"
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG (Imagem)</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="block text-sm font-medium font-secondary text-gray-700">
                  Seções para Exportar
                </span>
                <button
                  onClick={toggleAllSections}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleAllSections()
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-secondary"
                >
                  {Object.values(config.sections).every(Boolean)
                    ? 'Desmarcar Todas'
                    : 'Marcar Todas'}
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries({
                  generationActivation: 'Geração e Ativação',
                  salesConversion: 'Conversão de Vendas',
                  conversionRates: 'Taxas de Conversão',
                  leadStock: 'Estoque de Leads',
                  salesByConversionTime: 'Vendas por Tempo de Conversão',
                  leadQuality: 'Qualidade dos Leads',
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={config.sections[key as keyof ExportConfig['sections']]}
                      onChange={() => toggleSection(key as keyof ExportConfig['sections'])}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Incluir ${label} na exportação`}
                    />
                    <span className="text-sm font-secondary text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium font-secondary text-gray-700 mb-2">
                Tipos de Conteúdo
              </span>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={config.includeKPIs}
                    onChange={(e) => updateConfig({ includeKPIs: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label="Incluir KPIs"
                  />
                  <span className="text-sm font-secondary text-gray-700">KPIs e Métricas</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => updateConfig({ includeCharts: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label="Incluir gráficos"
                  />
                  <span className="text-sm font-secondary text-gray-700">Gráficos</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={config.includeTables}
                    onChange={(e) => updateConfig({ includeTables: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label="Incluir tabelas"
                  />
                  <span className="text-sm font-secondary text-gray-700">Tabelas</span>
                </label>
              </div>
            </div>

            {FILE_FORMATS.has(config.format) && (
              <div>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={config.sendToWhatsApp}
                    onChange={(e) => updateConfig({ sendToWhatsApp: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    aria-label="Enviar por WhatsApp"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .965 5.53.965 11.085c0 1.933.518 3.748 1.424 5.317L.654 24l7.855-2.143a11.882 11.882 0 003.54.536h.005c6.554 0 11.085-5.529 11.085-11.084 0-3.007-1.12-5.868-3.162-8.015" />
                    </svg>
                    <span className="text-sm font-secondary text-gray-700">
                      Enviar por WhatsApp
                    </span>
                  </div>
                </label>
                {config.sendToWhatsApp && (
                  <p className="text-xs text-gray-500 mt-1 ml-7 font-secondary">
                    Uma mensagem padrão será gerada com base no arquivo e filtros. Você poderá editá-la antes de enviar.
                  </p>
                )}
              </div>
            )}

            <div>
              <span className="block text-sm font-medium font-secondary text-gray-700 mb-2">
                Filtros Adicionais
              </span>
              <div className="space-y-3">
                <div>
                  <label htmlFor="origin-filter-select" className="block text-xs font-secondary text-gray-600 mb-1">
                    Origem (múltipla seleção)
                  </label>
                  <select
                    id="origin-filter-select"
                    multiple
                    value={config.filters.origin || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                      updateConfig({
                        filters: { ...config.filters, origin: selected },
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-secondary text-sm"
                    aria-label="Filtrar por origem"
                    size={4}
                  >
                    <option value="Origem">Origem</option>
                    <option value="Insta Turma">Insta Turma</option>
                    <option value="Atlética">Atlética</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1 font-secondary">
                    Mantenha Ctrl/Cmd pressionado para seleção múltipla
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="report-title-input" className="block text-sm font-medium font-secondary text-gray-700 mb-2">
                  Título do Relatório
                </label>
                <input
                  id="report-title-input"
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-secondary"
                  aria-label="Título do relatório"
                />
              </div>
              <div>
                <label htmlFor="filename-input" className="block text-sm font-medium font-secondary text-gray-700 mb-2">
                  Nome do Arquivo
                </label>
                <input
                  id="filename-input"
                  type="text"
                  value={config.filename}
                  onChange={(e) => updateConfig({ filename: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-secondary"
                  aria-label="Nome do arquivo"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClose()
                }
              }}
              disabled={isExporting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleExport()
                }
              }}
              disabled={isExporting || !Object.values(config.sections).some(Boolean)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Exportando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Exportar
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>

      <WhatsAppPreviewModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false)
          setExportedFile(null)
        }}
        onConfirm={handleWhatsAppConfirm}
        defaultMessage={
          exportedFile
            ? generateWhatsAppMessage(
                config.filename,
                config.format,
                filteredData.filters
              )
            : ''
        }
        filename={exportedFile?.filename || `${config.filename}.${config.format === 'excel' ? 'xlsx' : config.format}`}
        filters={filteredData.filters}
      />
    </>
  )
}

