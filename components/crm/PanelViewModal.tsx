'use client'

import { useState, useEffect } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

interface Panel {
  id: string
  title: string
  description: string
  key: string
}

interface Card {
  id: string
  title: string
  description?: string
  monetaryAmount?: number
  stepId?: string
  stepTitle?: string
  responsibleUser?: { id: string; name: string }
  contacts?: Array<{ id: string; name: string; phoneNumber?: string }>
  dueDate?: string
  isOverdue?: boolean
  createdAt: string
  updatedAt: string
  tags?: Array<{ id: string; name: string; bgColor?: string; textColor?: string }>
}

interface PanelViewModalProps {
  readonly panel: Panel
  readonly open: boolean
  readonly onClose: () => void
}

export default function PanelViewModal({ panel, open, onClose }: PanelViewModalProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open && panel) {
      fetchCards()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panel])

  const fetchCards = async () => {
    setIsLoading(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      const data = await cardsService.getAllCardsByPanel(panel.id)
      setCards(data as Card[])
    } catch (error) {
      console.error('Erro ao carregar cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCards = cards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!open) return null

  return (
    <>
      <button 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] cursor-default" 
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>
      
      <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-[60] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
                {panel.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {panel.description || 'Sem descrição'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-mono bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
              {panel.key}
            </span>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cards..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{cards.length} cards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(cards.reduce((sum, card) => sum + (card.monetaryAmount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!isLoading && filteredCards.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium">Nenhum card encontrado</p>
              <p className="text-sm mt-1">Crie um novo card para começar</p>
            </div>
          )}

          {!isLoading && filteredCards.length > 0 && (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
                  onClick={() => {
                    // Card details logic here
                    console.log('Card clicked:', card.id)
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {card.title}
                      </h3>
                      {card.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {card.description}
                        </p>
                      )}
                    </div>
                    {card.monetaryAmount && card.monetaryAmount > 0 && (
                      <span className="ml-4 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(card.monetaryAmount)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {card.stepTitle && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {card.stepTitle}
                      </span>
                    )}
                    
                    {card.responsibleUser && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {card.responsibleUser.name}
                      </span>
                    )}

                    {card.contacts && card.contacts.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {card.contacts.length} contato{card.contacts.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {card.dueDate && (
                      <span className={`flex items-center gap-1 ${card.isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(card.dueDate)}
                        {card.isOverdue && ' (Atrasado)'}
                      </span>
                    )}
                  </div>

                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {card.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: tag.bgColor || '#e5e7eb',
                            color: tag.textColor || '#374151'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

