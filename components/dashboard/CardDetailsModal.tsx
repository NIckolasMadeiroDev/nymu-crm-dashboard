'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react'
import type { HelenaContact } from '@/types/helena'
import { formatCurrency } from '@/utils/format-currency'

interface CardInfo {
  id: string
  title: string
  value: number
  stageId: string
  pipelineId: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  owner: string
  contactIds: string[]
  panelTitle: string
  panelKey: string
  stepTitle: string
  enteredGroupDate?: string | null
}

interface CardDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  cardType: 'leadsCreated' | 'leadsInGroup' | 'meetParticipants' | 'closedSales' | 'revenue'
  filters: any
  cards: CardInfo[]
  contacts: HelenaContact[]
  users?: Array<{ id: string; name: string }>
  isLoading?: boolean
}

type SortField = 'title' | 'value' | 'date' | 'owner' | 'contact' | 'panel' | 'step'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'owner' | 'contact' | 'date' | 'panel' | 'step'

export default function CardDetailsModal({
  isOpen,
  onClose,
  title,
  cardType,
  filters,
  cards,
  contacts,
  users = [],
  isLoading = false,
}: Readonly<CardDetailsModalProps>) {
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

  const getUserName = useCallback((userId?: string) => {
    if (!userId) return 'Não atribuído'
    const user = users.find((u) => u.id === userId)
    return user?.name || userId
  }, [users])

  const getContactName = useCallback((card: CardInfo) => {
    if (card.contactIds && Array.isArray(card.contactIds) && card.contactIds.length > 0) {
      const contact = contacts.find((c) => card.contactIds.includes(c.id))
      if (contact) return contact.name
    }
    return card.title || 'Sem contato associado'
  }, [contacts])

  const processedCards = useMemo(() => {
    let result = [...cards]

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      result = result.filter((card) => {
        const title = (card.title || '').toLowerCase()
        const contactName = getContactName(card).toLowerCase()
        const ownerName = getUserName(card.owner).toLowerCase()
        const panelTitle = (card.panelTitle || '').toLowerCase()
        const stepTitle = (card.stepTitle || '').toLowerCase()
        return (
          title.includes(search) ||
          contactName.includes(search) ||
          ownerName.includes(search) ||
          panelTitle.includes(search) ||
          stepTitle.includes(search)
        )
      })
    }

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
        case 'date': {
          const aDateField = cardType === 'leadsInGroup' && a.enteredGroupDate 
            ? a.enteredGroupDate 
            : (a.closedAt || a.updatedAt || a.createdAt || 0)
          const bDateField = cardType === 'leadsInGroup' && b.enteredGroupDate 
            ? b.enteredGroupDate 
            : (b.closedAt || b.updatedAt || b.createdAt || 0)
          aValue = new Date(aDateField).getTime()
          bValue = new Date(bDateField).getTime()
          break
        }
        case 'owner':
          aValue = getUserName(a.owner).toLowerCase()
          bValue = getUserName(b.owner).toLowerCase()
          break
        case 'contact':
          aValue = getContactName(a).toLowerCase()
          bValue = getContactName(b).toLowerCase()
          break
        case 'panel':
          aValue = (a.panelTitle || '').toLowerCase()
          bValue = (b.panelTitle || '').toLowerCase()
          break
        case 'step':
          aValue = (a.stepTitle || '').toLowerCase()
          bValue = (b.stepTitle || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [cards, searchTerm, sortField, sortDirection, getContactName, getUserName, cardType])

  const groupedCards = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Todos': processedCards }
    }

    const groups: Record<string, typeof processedCards> = {}

    processedCards.forEach((card) => {
      let key = 'Outros'

      switch (groupBy) {
        case 'owner':
          key = getUserName(card.owner)
          break
        case 'contact':
          key = getContactName(card)
          break
        case 'panel':
          key = card.panelTitle || 'Sem painel'
          break
        case 'step':
          key = card.stepTitle || 'Sem etapa'
          break
        case 'date': {
          const dateField = cardType === 'leadsInGroup' && card.enteredGroupDate 
            ? card.enteredGroupDate 
            : (card.closedAt || card.updatedAt || card.createdAt || 0)
          const date = new Date(dateField)
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          break
        }
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(card)
    })

    return groups
  }, [processedCards, groupBy, getContactName, getUserName, cardType])

  const totalValue = useMemo(() => {
    return processedCards.reduce((sum, card) => sum + (card.value || 0), 0)
  }, [processedCards])

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

  const getContactInfo = (card: CardInfo) => {
    const contact = contacts.find((c) => card.contactIds?.includes(c.id))
    return {
      name: getContactName(card),
      email: contact?.email || null,
      phone: contact?.phoneNumber || null,
    }
  }

  const getOwnerInfo = (card: CardInfo) => {
    return {
      name: getUserName(card.owner) || 'Não atribuído',
      email: null,
    }
  }

  const getRelevantDate = (card: CardInfo) => {
    let dateField: string | null | undefined
    if (cardType === 'leadsInGroup' && card.enteredGroupDate) {
      dateField = card.enteredGroupDate
    } else {
      dateField = card.closedAt || card.updatedAt || card.createdAt
    }
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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98vw] sm:w-[96vw] md:w-[94vw] lg:w-[92vw] xl:w-[90vw] max-w-[95vw] h-[85vh] sm:h-[80vh] md:h-[75vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-[70] flex flex-col overflow-hidden border-0 p-0"
        aria-labelledby="card-details-title"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2
              id="card-details-title"
              className="text-lg sm:text-xl font-bold font-primary text-gray-900 dark:text-white truncate"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Total</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                {processedCards.length}
              </p>
            </div>
            {(cardType === 'closedSales' || cardType === 'revenue') && (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Valor Total</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-secondary">Ticket Médio</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-primary">
                    {processedCards.length > 0
                      ? formatCurrency(totalValue / processedCards.length)
                      : formatCurrency(0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por título, contato, responsável, painel ou etapa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
                <option value="panel">Agrupar por Painel</option>
                <option value="step">Agrupar por Etapa</option>
                <option value="date">Agrupar por Data</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          )}
          {!isLoading && processedCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 font-secondary">
                {searchTerm ? 'Nenhum resultado encontrado para a busca.' : 'Nenhum item encontrado.'}
              </p>
            </div>
          )}
          {!isLoading && processedCards.length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedCards).map(([groupKey, groupCards]) => {
                const groupValue = groupCards.reduce((sum, card) => sum + (card.value || 0), 0)
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
                            ({groupCards.length} {groupCards.length === 1 ? 'item' : 'itens'})
                          </span>
                        </div>
                        {(cardType === 'closedSales' || cardType === 'revenue') && (
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(groupValue)}
                          </span>
                        )}
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
                              {(cardType === 'closedSales' || cardType === 'revenue') && (
                                <th
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleSort('value')}
                                >
                                  <div className="flex items-center gap-2">
                                    Valor
                                    <SortIcon field="value" sortField={sortField} sortDirection={sortDirection} />
                                  </div>
                                </th>
                              )}
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('panel')}
                              >
                                <div className="flex items-center gap-2">
                                  Painel
                                  <SortIcon field="panel" sortField={sortField} sortDirection={sortDirection} />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleSort('step')}
                              >
                                <div className="flex items-center gap-2">
                                  Etapa/Card
                                  <SortIcon field="step" sortField={sortField} sortDirection={sortDirection} />
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
                                  Contato
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
                            {groupCards.map((card) => {
                              const contactInfo = getContactInfo(card)
                              const ownerInfo = getOwnerInfo(card)
                              const relevantDate = getRelevantDate(card)

                              return (
                                <tr
                                  key={card.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {card.title || 'Sem título'}
                                    </div>
                                  </td>
                                  {(cardType === 'closedSales' || cardType === 'revenue') && (
                                    <td className="px-4 py-3 text-sm">
                                      <span className="font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(card.value || 0)}
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 dark:text-white">
                                        {card.panelTitle}
                                      </span>
                                      {card.panelKey && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          ({card.panelKey})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="text-gray-900 dark:text-white">
                                      {card.stepTitle}
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

