'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react'
import type { CrmDeal } from '@/types/crm'
import type { HelenaContact } from '@/types/helena'
import { formatCurrency } from '@/utils/format-currency'
import { getWeekDateRange, getDaysDateRange, formatDateRange } from '@/utils/date-ranges'

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

type SortField = 'title' | 'value' | 'date' | 'owner' | 'contact'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'owner' | 'contact' | 'date'

export default function ChartDetailsModal({
  isOpen,
  onClose,
  title,
  period,
  deals,
  contacts,
  users = [],
}: Readonly<ChartDetailsModalProps>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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
    globalThis.addEventListener('keydown', handleEscape)
    return () => globalThis.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Funções auxiliares (definidas antes dos useMemo que as usam)
  const getUserName = useCallback((userId?: string) => {
    if (!userId) return 'Não atribuído'
    const user = users.find((u) => u.id === userId)
    return user?.name || userId
  }, [users])

  const getOwnerName = useCallback((deal: CrmDeal) => {
    return deal.ownerName || getUserName(deal.owner) || 'Não atribuído'
  }, [getUserName])

  const getContactName = useCallback((deal: CrmDeal) => {
    if (deal.contactName) return deal.contactName
    if (deal.contactIds && Array.isArray(deal.contactIds) && deal.contactIds.length > 0) {
      const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
      if (contact) return contact.name
    }
    const contact = contacts.find((c) => c.name === deal.title)
    if (contact) return contact.name
    return deal.title || 'Sem contato associado'
  }, [contacts])

  // Calcular período formatado com range de datas preciso
  const periodLabel = useMemo(() => {
    if (period.type === 'week' && typeof period.value === 'number') {
      const { startDate, endDate } = getWeekDateRange(period.value)
      return `Sem ${period.value}: ${formatDateRange(startDate, endDate)}`
    } else if (period.type === 'days' && typeof period.value === 'number') {
      const { startDate, endDate } = getDaysDateRange(period.value)
      return `${period.value} dias: ${formatDateRange(startDate, endDate)}`
    }
    return period.label
  }, [period])

  // A API já filtra os deals por período e formata os dados
  const filteredDeals = useMemo(() => {
      if (!deals?.length) return []
      return deals.filter((deal) => deal?.id)
  }, [deals])

  // Filtrar e ordenar deals
  const processedDeals = useMemo(() => {
    let result = [...filteredDeals]

    // Aplicar busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      result = result.filter((deal) => {
        const title = (deal.title || '').toLowerCase()
        const contactName = getContactName(deal).toLowerCase()
        const ownerName = getOwnerName(deal).toLowerCase()
        return title.includes(search) || contactName.includes(search) || ownerName.includes(search)
      })
    }

    // Aplicar ordenação
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = (a.title || '').toLowerCase()
          bValue = (b.title || '').toLowerCase()
          break
        case 'value':
          aValue = a.value || 0
          bValue = b.value || 0
          break
        case 'date':
          aValue = new Date(a.relevantDate || a.closedAt || a.updatedAt || a.createdAt || 0).getTime()
          bValue = new Date(b.relevantDate || b.closedAt || b.updatedAt || b.createdAt || 0).getTime()
          break
        case 'owner':
          aValue = getOwnerName(a).toLowerCase()
          bValue = getOwnerName(b).toLowerCase()
          break
        case 'contact':
          aValue = getContactName(a).toLowerCase()
          bValue = getContactName(b).toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [filteredDeals, searchTerm, sortField, sortDirection, getContactName, getOwnerName])

  // Agrupar deals
  const groupedDeals = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Todos': processedDeals }
    }

    const groups: Record<string, typeof processedDeals> = {}

    processedDeals.forEach((deal) => {
      let key = 'Outros'

      switch (groupBy) {
        case 'owner':
          key = getOwnerName(deal)
          break
        case 'contact':
          key = getContactName(deal)
          break
        case 'date': {
          const date = new Date(deal.relevantDate || deal.closedAt || deal.updatedAt || deal.createdAt || 0)
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          break
        }
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(deal)
    })

    return groups
  }, [processedDeals, groupBy, getContactName, getOwnerName])

  const getContactInfo = (deal: any) => {
    const contact = contacts.find((c) => deal.contactIds?.includes(c.id))
    return {
      name: deal.contactName || contact?.name || deal.title || 'Sem contato associado',
      email: deal.contactEmail || contact?.email || null,
      phone: deal.contactPhone || contact?.phoneNumber || null,
    }
  }

  const getOwnerInfo = (deal: any) => {
    return {
      name: deal.ownerName || getUserName(deal.owner) || 'Não atribuído',
      email: deal.ownerEmail || null,
    }
  }

  const getRelevantDate = (deal: any) => {
    if (deal.relevantDateFormatted) return deal.relevantDateFormatted
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
    return processedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  }, [processedDeals])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }


  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />
      <dialog
        open={isOpen}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-6xl h-[85vh] sm:h-[80vh] md:h-[75vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-[70] flex flex-col overflow-hidden border-0 p-0"
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
                {processedDeals.length}
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
                {processedDeals.length > 0
                  ? formatCurrency(totalValue / processedDeals.length)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por título, contato ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Group By */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value as GroupBy)
                  setExpandedGroups(new Set())
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">Sem agrupamento</option>
                <option value="owner">Agrupar por Responsável</option>
                <option value="contact">Agrupar por Contato</option>
                <option value="date">Agrupar por Data</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 min-h-0">
          {processedDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-secondary">
                {(() => {
                  if (searchTerm) {
                    return 'Nenhum resultado encontrado para a busca.'
                  }
                  if (title.toLowerCase().includes('leads criados')) {
                    return 'Nenhum lead encontrado para este período.'
                  }
                  return 'Nenhuma venda encontrada para este período.'
                })()}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDeals).map(([groupKey, groupDeals]) => {
                const groupValue = groupDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
                const isExpanded = groupBy === 'none' || expandedGroups.has(groupKey)

                return (
                  <div key={groupKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {groupBy !== 'none' && (
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {groupKey}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({groupDeals.length} {groupDeals.length === 1 ? 'item' : 'itens'})
                          </span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(groupValue)}
                        </span>
                      </button>
                    )}

                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('title')}
                              >
                                <div className="flex items-center gap-2">
                                  Título
                                  <SortIcon field="title" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('value')}
                              >
                                <div className="flex items-center gap-2">
                                  Valor
                                  <SortIcon field="value" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('owner')}
                              >
                                <div className="flex items-center gap-2">
                                  Responsável
                                  <SortIcon field="owner" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('contact')}
                              >
                                <div className="flex items-center gap-2">
                                  Contato / Lead
                                  <SortIcon field="contact" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('date')}
                              >
                                <div className="flex items-center gap-2">
                                  Data
                                  <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {groupDeals.map((deal) => {
                              const contactInfo = getContactInfo(deal)
                              const ownerInfo = getOwnerInfo(deal)
                              const relevantDate = getRelevantDate(deal)
                              const valueDisplay = deal.valueFormatted ?? formatCurrency(deal.value || 0)

                              return (
                                <tr
                                  key={deal.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {deal.title || 'Sem título'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      {valueDisplay}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 dark:text-white">
                                        {ownerInfo.name}
                                      </span>
                                      {ownerInfo.email && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {ownerInfo.email}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 dark:text-white">
                                        {contactInfo.name}
                                      </span>
                                      {contactInfo.email && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {contactInfo.email}
                                        </span>
                                      )}
                                      {contactInfo.phone && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {contactInfo.phone}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    {relevantDate}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </dialog>
    </>
  )
}

// Componente SortIcon movido para fora do componente principal
function SortIcon({ field, sortField, sortDirection }: Readonly<{ field: SortField; sortField: SortField; sortDirection: SortDirection }>) {
  if (sortField !== field) {
    return <ArrowUpDown size={14} className="text-gray-400" />
  }
  return sortDirection === 'asc' ? (
    <ArrowUp size={14} className="text-blue-600 dark:text-blue-400" />
  ) : (
    <ArrowDown size={14} className="text-blue-600 dark:text-blue-400" />
  )
}
