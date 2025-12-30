'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import CardDetailsModal from './CardDetailsModal'

interface PanelStep {
  id: string
  title: string
  position: number
  isInitial: boolean
  isFinal: boolean
  archived?: boolean
  color?: string
}

interface Panel {
  id: string
  title: string
  description: string
  key: string
  steps?: PanelStep[]
}

interface Card {
  id: string
  title: string
  description?: string | null
  monetaryAmount?: number | null
  stepId?: string | null
  contactIds?: string[] | null
  dueDate?: string | null
  isOverdue?: boolean
  key?: string
  number?: number
}

interface PanelViewModalProps {
  readonly panel: Panel
  readonly open: boolean
  readonly onClose: () => void
}

export default function PanelViewModal({ panel, open, onClose }: PanelViewModalProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStepId, setSelectedStepId] = useState<string>('all')
  const [minValue, setMinValue] = useState<string>('')
  const [maxValue, setMaxValue] = useState<string>('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const hasLoadedRef = useRef<string | null>(null)

  const fetchCards = useCallback(async (panelId: string, forceReload = false) => {
    if (!panelId) return
    
    // Evita recarregar se já carregou para este painel e não é um reload forçado
    if (!forceReload && hasLoadedRef.current === panelId) {
      return
    }

    setIsLoading(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      // Não passamos IncludeDetails pois o endpoint de listagem não aceita esses parâmetros
      const data = await cardsService.getAllCardsByPanel(panelId)
      setCards(data as Card[])
      hasLoadedRef.current = panelId
    } catch (error) {
      console.error('Erro ao carregar cards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Só carrega quando o modal abre pela primeira vez ou quando o painel muda
  useEffect(() => {
    if (open && panel?.id) {
      // Se mudou o painel, reseta o ref
      if (hasLoadedRef.current !== panel.id) {
        hasLoadedRef.current = null
        setCards([])
      }
      fetchCards(panel.id)
    }
  }, [open, panel?.id, fetchCards])

  // Reseta filtros quando fecha o modal
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setSelectedStepId('all')
      setMinValue('')
      setMaxValue('')
      setShowOverdueOnly(false)
    }
  }, [open])

  // Filtra cards baseado nos filtros aplicados
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Filtro de busca por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesTitle = card.title?.toLowerCase().includes(searchLower)
        const matchesDescription = card.description?.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDescription) return false
      }

      // Filtro por etapa
      if (selectedStepId !== 'all' && card.stepId !== selectedStepId) {
        return false
      }

      // Filtro por valor monetário mínimo
      if (minValue) {
        const min = parseFloat(minValue)
        if (!isNaN(min) && (!card.monetaryAmount || card.monetaryAmount < min)) {
          return false
        }
      }

      // Filtro por valor monetário máximo
      if (maxValue) {
        const max = parseFloat(maxValue)
        if (!isNaN(max) && (!card.monetaryAmount || card.monetaryAmount > max)) {
          return false
        }
      }

      // Filtro por vencidos
      if (showOverdueOnly && !card.isOverdue) {
        return false
      }

      return true
    })
  }, [cards, searchTerm, selectedStepId, minValue, maxValue, showOverdueOnly])

  const stepsWithCards = useMemo(() => {
    if (!panel.steps) return []

    const sortedSteps = [...panel.steps]
      .filter(step => !step.archived)
      .sort((a, b) => a.position - b.position)

    return sortedSteps.map(step => ({
      ...step,
      cards: filteredCards.filter(card => card.stepId === step.id)
    }))
  }, [panel.steps, filteredCards])

  const formatCurrency = (value?: number | null) => {
    if (!value) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    setShowCardDetails(true)
  }

  const handleCloseCardDetails = () => {
    setShowCardDetails(false)
    setSelectedCard(null)
  }

  const handleCardUpdate = useCallback(() => {
    // Recarrega os cards quando um card é atualizado
    if (panel?.id) {
      fetchCards(panel.id, true)
    }
  }, [panel?.id, fetchCards])

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

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-secondary">
                  {panel.description || 'Sem descrição'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                {panel.key}
              </span>
            </div>
          </div>

          {/* Barra de pesquisa e filtros */}
          <div className="px-6 pb-4 space-y-3">
            {/* Barra de pesquisa */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cards por título ou descrição..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro por etapa */}
              <select
                value={selectedStepId}
                onChange={(e) => setSelectedStepId(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as etapas</option>
                {panel.steps?.filter(step => !step.archived).sort((a, b) => a.position - b.position).map(step => (
                  <option key={step.id} value={step.id}>{step.title}</option>
                ))}
              </select>

              {/* Filtro por valor mínimo */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Valor min:</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="0"
                  className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por valor máximo */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Valor max:</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="∞"
                  className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por vencidos */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverdueOnly}
                  onChange={(e) => setShowOverdueOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Apenas vencidos</span>
              </label>

              {/* Botão limpar filtros */}
              {(searchTerm || selectedStepId !== 'all' || minValue || maxValue || showOverdueOnly) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedStepId('all')
                    setMinValue('')
                    setMaxValue('')
                    setShowOverdueOnly(false)
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}

              {/* Contador de resultados */}
              <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                {filteredCards.length} de {cards.length} cards
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoading && stepsWithCards.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Nenhuma fase encontrada</p>
              <p className="text-sm mt-1">Configure as fases do painel para começar</p>
            </div>
          )}

          {!isLoading && stepsWithCards.length > 0 && (
            <div className="flex gap-4 h-full min-w-max">
              {stepsWithCards.map((step) => (
                <div
                  key={step.id}
                  className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col"
                >

                  <div
                    className="p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg"
                    style={{
                      borderTopColor: step.color || '#3B82F6',
                      borderTopWidth: '4px'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white font-primary">
                        {step.title}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {step.cards.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {step.cards.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        Nenhum card nesta fase
                      </div>
                    ) : (
                      step.cards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => handleCardClick(card)}
                          className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {card.title}
                            </h4>
                            {card.key && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded flex-shrink-0">
                                {card.key}
                              </span>
                            )}
                          </div>

                          {card.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {card.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            {card.monetaryAmount && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(card.monetaryAmount)}
                              </span>
                            )}
                            {card.contactIds && card.contactIds.length > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {card.contactIds.length}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCardDetails && selectedCard && (
        <CardDetailsModal
          cardId={selectedCard.id}
          panelId={panel.id}
          open={showCardDetails}
          onClose={handleCloseCardDetails}
          onUpdate={handleCardUpdate}
        />
      )}
    </>
  )
}
