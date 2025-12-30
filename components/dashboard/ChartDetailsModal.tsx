'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Calendar, User, DollarSign, Tag } from 'lucide-react'
import type { CrmDeal } from '@/types/crm'
import type { HelenaContact } from '@/types/helena'
import { formatCurrency } from '@/utils/format-currency'

interface ChartDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  period: {
    type: 'week' | 'days' | 'date'
    value: string | number
    label: string
  }
  deals: CrmDeal[]
  contacts: HelenaContact[]
  users?: Array<{ id: string; name: string }>
}

export default function ChartDetailsModal({
  isOpen,
  onClose,
  title,
  period,
  deals,
  contacts,
  users = [],
}: Readonly<ChartDetailsModalProps>) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // A API já filtra os deals por período e formata os dados
  // Apenas garantimos que temos deals válidos
  const filteredDeals = useMemo(() => {
    if (!deals || deals.length === 0) return []
    // Retornar todos os deals que a API já filtrou e formatou
    return deals.filter((deal) => deal && deal.id)
  }, [deals])

  // Calcular período formatado para exibição
  const periodLabel = useMemo(() => {
    if (period.type === 'week') {
      // Para semana, tentar exibir um range de datas
      if (filteredDeals.length > 0) {
        const dates = filteredDeals
          .map((deal) => new Date(deal.relevantDate || deal.createdAt || deal.closedAt || deal.updatedAt))
          .filter((date) => !isNaN(date.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())
        
        if (dates.length > 0) {
          const firstDate = dates[0]
          const lastDate = dates[dates.length - 1]
          return `${firstDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Sem ${period.value})`
        }
      }
      return `Semana ${period.value} - ${period.label}`
    }
    return period.label
  }, [period, filteredDeals])

  const getUserName = (userId?: string) => {
    if (!userId) return 'Não atribuído'
    const user = users.find((u) => u.id === userId)
    return user?.name || userId
  }

  const getContactName = (deal: any) => {
    // A API já retorna contactName formatado
    if (deal.contactName) return deal.contactName
    // Fallback: tentar encontrar contato associado ao deal
    if (deal.contactIds && Array.isArray(deal.contactIds) && deal.contactIds.length > 0) {
      const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
      if (contact) return contact.name
    }
    // Se não encontrar, tentar pelo título do deal
    const contact = contacts.find((c) => c.name === deal.title)
    if (contact) return contact.name
    // Fallback: usar o título do deal ou uma mensagem padrão
    return deal.title || 'Sem contato associado'
  }

  const getContactInfo = (deal: any) => {
    const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
    return {
      name: deal.contactName || contact?.name || deal.title || 'Sem contato associado',
      email: deal.contactEmail || contact?.email || null,
      phone: deal.contactPhone || contact?.phone || null,
    }
  }

  const getOwnerInfo = (deal: any) => {
    return {
      name: deal.ownerName || getUserName(deal.owner),
      email: deal.ownerEmail || null,
    }
  }

  const getRelevantDate = (deal: any) => {
    // A API já retorna relevantDateFormatted
    if (deal.relevantDateFormatted) return deal.relevantDateFormatted
    // Fallback: usar closedAt, updatedAt ou createdAt
    const dateField = deal.closedAt || deal.updatedAt || deal.createdAt
    if (!dateField) return 'Data não disponível'
    const date = new Date(dateField)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalValue = useMemo(() => {
    return filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  }, [filteredDeals])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-4 sm:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-details-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2
              id="chart-details-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 dark:text-white truncate"
            >
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-secondary">
              Período: {periodLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">
                {title.toLowerCase().includes('leads criados') ? 'Total de Leads' : 'Total de Vendas'}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                {filteredDeals.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Valor Total</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Ticket Médio</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                {filteredDeals.length > 0
                  ? formatCurrency(totalValue / filteredDeals.length)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-secondary">
                {title.toLowerCase().includes('leads criados') 
                  ? 'Nenhum lead encontrado para este período.' 
                  : 'Nenhuma venda encontrada para este período.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeals.map((deal) => {
                const contactInfo = getContactInfo(deal)
                const ownerInfo = getOwnerInfo(deal)
                const relevantDate = getRelevantDate(deal)
                // A API já retorna valueFormatted, mas vamos garantir que está formatado
                const valueDisplay = deal.valueFormatted || formatCurrency(deal.value || 0)

                return (
                  <div
                    key={deal.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white font-primary mb-3">
                          {deal.title || 'Lead sem título'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <DollarSign size={16} className="flex-shrink-0 text-green-600 dark:text-green-400" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Valor</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {valueDisplay}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User size={16} className="flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Responsável</span>
                              <span className="font-secondary text-gray-900 dark:text-white">
                                {ownerInfo.name}
                              </span>
                              {ownerInfo.email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {ownerInfo.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Tag size={16} className="flex-shrink-0 text-purple-600 dark:text-purple-400" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Contato / Lead</span>
                              <span className="font-secondary text-gray-900 dark:text-white truncate">
                                {contactInfo.name}
                              </span>
                              {contactInfo.email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {contactInfo.email}
                                </span>
                              )}
                              {contactInfo.phone && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {contactInfo.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} className="flex-shrink-0 text-orange-600 dark:text-orange-400" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Data</span>
                              <span className="font-secondary text-gray-900 dark:text-white">
                                {relevantDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

