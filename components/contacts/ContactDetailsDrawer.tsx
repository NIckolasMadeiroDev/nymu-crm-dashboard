import React, { useEffect, useState } from 'react'
import type { HelenaContact } from '@/types/helena'
import { formatPhoneNumber } from '@/utils/format-phone'

interface ContactDetailsDrawerProps {
  readonly open: boolean
  readonly contact: HelenaContact | null
  readonly onClose: () => void
  readonly onEdit?: () => void
  readonly onDelete?: () => void
}

function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; className: string; icon: string }> = {
    ACTIVE: {
      label: 'Ativo',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
      icon: '✓'
    },
    ARCHIVED: {
      label: 'Arquivado',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
      icon: '📦'
    },
    BLOCKED: {
      label: 'Bloqueado',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
      icon: '🚫'
    },
  }

  return statusMap[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '•'
  }
}

export default function ContactDetailsDrawer({ open, contact, onClose, onEdit, onDelete }: ContactDetailsDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setShowDeleteConfirm(false);
    }
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000);
    }
  };

  if (!open || !contact) return null;

  const statusConfig = getStatusConfig(contact.status);

  return (
    <>
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-default"
        onClick={handleClose}
        aria-label="Fechar modal"
        type="button"
      ></button>

      <aside
        className={`fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-900 shadow-2xl w-full max-w-md flex flex-col overflow-hidden z-50 ${isClosing ? 'animate-slide-out' : 'animate-slide-in'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-details-title"
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 id="contact-details-title" className="text-xl font-semibold text-gray-900 dark:text-white font-primary">Detalhes do Contato</h2>
          <div className="w-8"></div>
        </div>


        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shadow-lg">
              <span className="text-blue-600 dark:text-blue-300 text-2xl font-bold">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">{contact.name}</h3>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border mt-2 ${statusConfig.className}`}>
                <span>{statusConfig.icon}</span>
                <span>{statusConfig.label}</span>
              </div>
            </div>
          </div>


          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-secondary">
                Informações de Contato
              </h4>

              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Telefone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                    {formatPhoneNumber(contact.phoneNumber)}
                  </p>
                </div>
              </div>

              {contact.email && (
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">E-mail</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all font-secondary">
                      {contact.email}
                    </p>
                  </div>
                </div>
              )}
            </div>


            {contact.tags && contact.tags.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-secondary">
                  Etiquetas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                      style={{
                        backgroundColor: tag.bgColor || '#e5e7eb',
                        color: tag.textColor || '#374151',
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}


            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 font-secondary">
                Informações do Sistema
              </h4>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 font-secondary">
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-300">{contact.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Criado em:</span>
                  <span className="text-gray-900 dark:text-gray-300">
                    {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Atualizado em:</span>
                  <span className="text-gray-900 dark:text-gray-300">
                    {new Date(contact.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2">
          {showDeleteConfirm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium text-center font-secondary">
                ⚠️ Clique novamente para confirmar a exclusão
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm font-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm font-secondary bg-red-600 hover:bg-red-700 text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

