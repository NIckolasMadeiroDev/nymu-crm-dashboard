'use client'

import { useState, useEffect } from 'react'
import type { DashboardFilters } from '@/types/dashboard'

interface WhatsAppPreviewModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onConfirm: (message: string) => void
  readonly defaultMessage: string
  readonly filename: string
  readonly filters?: DashboardFilters
}

export default function WhatsAppPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  defaultMessage,
  filename,
  filters,
}: Readonly<WhatsAppPreviewModalProps>) {
  const [message, setMessage] = useState(defaultMessage)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage)
    }
  }, [isOpen, defaultMessage])

  if (!isOpen) return null

  const handleConfirm = () => {
    setIsSending(true)
    onConfirm(message)
    setIsSending(false)
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open={isOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
        aria-modal="true"
        aria-labelledby="whatsapp-preview-title"
        onCancel={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
          onClick={(e) => e.stopPropagation()}
          aria-label="Prévia da mensagem do WhatsApp"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .965 5.53.965 11.085c0 1.933.518 3.748 1.424 5.317L.654 24l7.855-2.143a11.882 11.882 0 003.54.536h.005c6.554 0 11.085-5.529 11.085-11.084 0-3.007-1.12-5.868-3.162-8.015" />
                </svg>
              </div>
              <h2
                id="whatsapp-preview-title"
                className="text-lg sm:text-xl font-bold font-primary text-gray-900"
              >
                Enviar por WhatsApp
              </h2>
            </div>
            <button
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClose()
                }
              }}
              aria-label="Fechar modal"
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

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label
                htmlFor="whatsapp-message"
                className="block text-sm font-medium font-secondary text-gray-700 mb-2"
              >
                Mensagem
              </label>
              <textarea
                id="whatsapp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-secondary resize-none"
                placeholder="Digite sua mensagem aqui..."
                aria-label="Editar mensagem do WhatsApp"
              />
              <p className="text-xs text-gray-500 mt-1 font-secondary">
                Você pode editar a mensagem antes de enviar
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold font-secondary text-gray-700 mb-2">
                Informações do Arquivo
              </h3>
              <div className="space-y-1 text-sm font-secondary text-gray-600">
                <p>
                  <span className="font-medium">Arquivo:</span> {filename}
                </p>
                {filters && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Filtros aplicados:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      {filters.date && <li>Data: {filters.date}</li>}
                      {filters.season && <li>Temporada: {filters.season}</li>}
                      {filters.sdr && filters.sdr !== 'Todos' && <li>SDR: {filters.sdr}</li>}
                      {filters.college && filters.college !== 'Todas' && (
                        <li>Faculdade: {filters.college}</li>
                      )}
                      {filters.origin && filters.origin !== '' && (
                        <li>Origem: {filters.origin}</li>
                      )}
                    </ul>
                  </div>
                )}
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
              disabled={isSending}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleConfirm()
                }
              }}
              disabled={isSending || !message.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isSending ? (
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
                  Enviando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .965 5.53.965 11.085c0 1.933.518 3.748 1.424 5.317L.654 24l7.855-2.143a11.882 11.882 0 003.54.536h.005c6.554 0 11.085-5.529 11.085-11.084 0-3.007-1.12-5.868-3.162-8.015" />
                  </svg>
                  Enviar por WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

