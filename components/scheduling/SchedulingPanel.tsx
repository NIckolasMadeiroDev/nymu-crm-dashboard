'use client'

import { useState, useEffect } from 'react'
import type { ScheduledReport, ExportFormat } from '@/services/export/export-service'
import { schedulingService } from '@/services/scheduling/scheduling-service'
import type { DashboardFilters } from '@/types/dashboard'

interface SchedulingPanelProps {
  readonly filters: DashboardFilters
  readonly onClose: () => void
}

export default function SchedulingPanel({ filters, onClose }: Readonly<SchedulingPanelProps>) {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<ScheduledReport>>({
    name: '',
    schedule: 'daily',
    time: '09:00',
    recipients: [],
    format: 'pdf',
    filters,
    enabled: true,
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    setReports(schedulingService.getReports())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.schedule && formData.time && formData.format) {
      schedulingService.createReport({
        name: formData.name,
        schedule: formData.schedule,
        time: formData.time,
        recipients: formData.recipients || [],
        format: formData.format,
        filters: formData.filters,
        enabled: formData.enabled ?? true,
      })
      loadReports()
      setShowForm(false)
      setFormData({
        name: '',
        schedule: 'daily',
        time: '09:00',
        recipients: [],
        format: 'pdf',
        filters,
        enabled: true,
      })
    }
  }

  const handleToggle = (id: string, enabled: boolean) => {
    schedulingService.updateReport(id, { enabled })
    loadReports()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este relatório agendado?')) {
      schedulingService.deleteReport(id)
      loadReports()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 hover:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
        aria-modal="true"
        aria-labelledby="scheduling-panel-title"
        onCancel={onClose}
      >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="scheduling-panel-title" className="text-xl font-bold font-primary">
            Relatórios Agendados
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar painel de agendamento"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-name-input" className="block text-sm font-medium text-gray-700 font-secondary mb-1">
                Nome do Relatório
              </label>
              <input
                id="report-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="schedule-frequency-select" className="block text-sm font-medium text-gray-700 font-secondary mb-1">
                  Frequência
                </label>
                <select
                  id="schedule-frequency-select"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule: e.target.value as 'daily' | 'weekly' | 'monthly',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <div>
                <label htmlFor="schedule-time-input" className="block text-sm font-medium text-gray-700 font-secondary mb-1">
                  Horário
                </label>
                <input
                  id="schedule-time-input"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="schedule-format-select" className="block text-sm font-medium text-gray-700 font-secondary mb-1">
                Formato
              </label>
              <select
                id="schedule-format-select"
                value={formData.format}
                onChange={(e) =>
                  setFormData({ ...formData, format: e.target.value as ExportFormat })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary"
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary"
              >
                Criar Relatório
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    name: '',
                    schedule: 'daily',
                    time: '09:00',
                    recipients: [],
                    format: 'pdf',
                    filters,
                    enabled: true,
                  })
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              onClick={() => setShowForm(true)}
              aria-label="Criar novo relatório agendado"
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Novo Relatório Agendado
            </button>

            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-gray-500 font-secondary text-center py-8">
                  Nenhum relatório agendado
                </p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold font-primary mb-1">
                          {report.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-secondary">
                          {(() => {
                            if (report.schedule === 'daily') return 'Diário'
                            if (report.schedule === 'weekly') return 'Semanal'
                            return 'Mensal'
                          })()}{' '}
                          às {report.time} | Formato: {report.format.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 font-secondary mt-1">
                          {report.recipients.length} destinatário(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(report.id, !report.enabled)}
                          aria-label={`${report.enabled ? 'Desativar' : 'Ativar'} relatório ${report.name}`}
                          aria-pressed={report.enabled}
                          className={`px-3 py-1 rounded text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            report.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {report.enabled ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          aria-label={`Excluir relatório ${report.name}`}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
    </>
  )
}

