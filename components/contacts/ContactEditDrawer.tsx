import React, { useState, useEffect } from "react"
import type { HelenaContact } from '@/types/helena'
import { maskPhoneInput } from '@/utils/format-phone'

interface ContactEditDrawerProps {
  readonly open: boolean
  readonly loading?: boolean
  readonly contact?: Partial<HelenaContact>
  readonly mode: 'create' | 'edit'
  readonly onSubmit: (data: Partial<HelenaContact>) => void
  readonly onClose: () => void
}

export default function ContactEditDrawer({ open, loading, contact, mode, onSubmit, onClose }: ContactEditDrawerProps) {
  const [form, setForm] = useState<Partial<HelenaContact>>({})
  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(contact || {})
      setPhoneDisplay(maskPhoneInput(contact?.phoneNumber || ''))
      setIsClosing(false)
    }
  }, [contact, open])

  function handleChange<K extends keyof HelenaContact>(field: K, value: any) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskPhoneInput(e.target.value)
    setPhoneDisplay(masked)
    const cleaned = e.target.value.replaceAll(/\D/g, '')
    handleChange('phoneNumber', cleaned)
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  if (!open) return null

  return (
    <>
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-default"
        onClick={handleClose}
        aria-label="Fechar modal"
        type="button"
      ></button>

      <form
        onSubmit={handleSubmit}
        className={`fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-900 shadow-2xl w-full max-w-md flex flex-col overflow-hidden z-50 ${isClosing ? 'animate-slide-out' : 'animate-slide-in'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-edit-title"
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 id="contact-edit-title" className="text-xl font-semibold text-gray-900 dark:text-white font-primary">
            {mode === 'create' ? 'Novo Contato' : 'Editar Contato'}
          </h2>
          <div className="w-8"></div>
        </div>


        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="contact-name"
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all font-secondary"
                placeholder="Ex: João Silva"
                value={form.name || ''}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>
          </div>


          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
              Telefone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                id="contact-phone"
                type="tel"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono transition-all font-secondary"
                placeholder="(00) 00000-0000"
                value={phoneDisplay}
                onChange={handlePhoneChange}
                maxLength={15}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-secondary">
              Digite apenas números, a formatação é automática
            </p>
          </div>


          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="contact-email"
                type="email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all font-secondary"
                placeholder="exemplo@email.com"
                value={form.email || ''}
                onChange={e => handleChange('email', e.target.value)}
              />
            </div>
          </div>


          <div>
            <label htmlFor="contact-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
              Status
            </label>
            <select
              id="contact-status"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all font-secondary"
              value={form.status || 'ACTIVE'}
              onChange={e => handleChange('status', e.target.value)}
            >
              <option value="ACTIVE">✓ Ativo</option>
              <option value="ARCHIVED">📦 Arquivado</option>
              <option value="BLOCKED">🚫 Bloqueado</option>
            </select>
          </div>
        </div>


        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-sm disabled:cursor-not-allowed font-secondary"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {mode === 'create' ? 'Criar Contato' : 'Salvar Alterações'}
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  )
}

