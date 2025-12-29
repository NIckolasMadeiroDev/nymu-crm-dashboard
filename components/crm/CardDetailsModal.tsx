'use client'

import { useState, useEffect } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import type { HelenaCard, HelenaCardNote } from '@/services/helena/helena-cards-service'
import type { HelenaContact } from '@/services/helena/helena-contacts-service'
import type { HelenaPanel } from '@/services/helena/helena-panels-service'
import type { PanelStep } from '@/services/helena/helena-panels-service'

interface CardDetailsModalProps {
  readonly cardId: string
  readonly panelId: string
  readonly open: boolean
  readonly onClose: () => void
  readonly onUpdate: () => void
}

interface HistoryEntry {
  id: string
  text: string
  userName: string
  date: string
  type: 'created' | 'moved' | 'value_changed' | 'description_changed' | 'note'
}

export default function CardDetailsModal({ cardId, panelId, open, onClose, onUpdate }: CardDetailsModalProps) {
  const [card, setCard] = useState<HelenaCard | null>(null)
  const [panel, setPanel] = useState<HelenaPanel | null>(null)
  const [contacts, setContacts] = useState<HelenaContact[]>([])
  const [notes, setNotes] = useState<HelenaCardNote[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string>('')
  const [isMoving, setIsMoving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)

  useEffect(() => {
    if (open && cardId && panelId) {
      fetchCardDetails()
      fetchNotes()
      fetchPanel()
    }
  }, [open, cardId, panelId])

  useEffect(() => {
    if (card && panel) {
      setSelectedStepId(card.stepId || '')
      buildHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, notes, panel])

  useEffect(() => {
    if (card && card.contactIds && card.contactIds.length > 0) {
      fetchContacts()
    } else {
      setContacts([])
    }
  }, [card])

  const fetchCardDetails = async () => {
    setIsLoading(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      // Buscar card com detalhes do responsável
      const data = await cardsService.getCardById(cardId, ['responsibleUser'])
      setCard(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes do card:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPanel = async () => {
    try {
      const panelsService = helenaServiceFactory.getPanelsService()
      const data = await panelsService.getPanelById(panelId, ['steps'])
      setPanel(data)
    } catch (error) {
      console.error('Erro ao carregar painel:', error)
    }
  }

  const fetchContacts = async () => {
    if (!card?.contactIds || card.contactIds.length === 0) return
    
    setIsLoadingContacts(true)
    try {
      const contactsService = helenaServiceFactory.getContactsService()
      const contactPromises = card.contactIds.map(id => 
        contactsService.getContactById(id, ['tags']).catch(() => null)
      )
      const contactResults = await Promise.all(contactPromises)
      setContacts(contactResults.filter(c => c !== null) as HelenaContact[])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const handleMoveToStep = async (newStepId: string) => {
    if (!card || !panel || newStepId === card.stepId) return

    setIsMoving(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      
      // Obter nomes das fases
      const steps = (panel.steps as PanelStep[]) || []
      const currentStep = steps.find(s => s.id === card.stepId)
      const newStep = steps.find(s => s.id === newStepId)
      
      // Mover o card
      await cardsService.moveCardToStep(cardId, newStepId)
      
      // Adicionar nota sobre a movimentação
      try {
        await cardsService.addCardNote(cardId, {
          text: `Item movido de ${currentStep?.title || 'uma fase'} para ${newStep?.title || 'outra fase'}`
        })
      } catch (noteError) {
        console.warn('Erro ao adicionar nota de movimentação:', noteError)
        // Não falhar a operação se a nota não puder ser adicionada
      }
      
      // Atualizar card localmente
      const updatedCard = await cardsService.getCardById(cardId)
      setCard(updatedCard)
      setSelectedStepId(newStepId)
      
      // Recarregar histórico para incluir a movimentação
      await fetchNotes()
      
      // Notificar componente pai para atualizar o Kanban
      onUpdate()
    } catch (error) {
      console.error('Erro ao mover card:', error)
      alert('Erro ao mover card. Tente novamente.')
    } finally {
      setIsMoving(false)
    }
  }

  const fetchNotes = async () => {
    setIsLoadingNotes(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()
      // Buscar todas as notas ordenadas por data de criação (mais antigas primeiro)
      const response = await cardsService.listCardNotes(cardId, {
        PageSize: 100,
        OrderBy: 'CreatedAt',
        OrderDirection: 'ASCENDING' // Mudado para ASCENDING para facilitar ordenação
      })
      // Garantir que estamos salvando todas as notas retornadas
      const allNotes = response.items || []
      setNotes(allNotes)
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
      setNotes([]) // Garantir que sempre temos um array
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const buildHistory = () => {
    if (!card || !panel) return

    console.log('buildHistory: Iniciando construção', { 
      notesCount: notes.length,
      notes: notes 
    })

    const historyEntries: HistoryEntry[] = []

    // Adicionar criação do card
    if (card.createdAt) {
      // Buscar o nome da fase inicial - tentar encontrar pela primeira fase não arquivada ordenada por position
      let initialStepTitle = 'uma fase'
      if (panel.steps && Array.isArray(panel.steps)) {
        const steps = (panel.steps as PanelStep[])
          .filter(s => s && !s.archived)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
        
        // Tentar encontrar a fase inicial (isInitial) ou a primeira fase
        const initialStep = steps.find(s => s.isInitial) || steps[0]
        if (initialStep) {
          initialStepTitle = initialStep.title
        }
      }

      const userName = card.responsibleUser?.name || 'Sistema'
      historyEntries.push({
        id: `created-${card.id}`,
        text: `Item criado por ${userName} em ${initialStepTitle}`,
        userName,
        date: formatDate(card.createdAt),
        type: 'created'
      })
    }

    // Processar anotações como histórico
    // Garantir que processamos TODAS as notas, mesmo que não tenham texto
    notes.forEach((note) => {
      // Se não tem texto, ainda assim criar uma entrada genérica
      if (!note.text || note.text.trim() === '') {
        // Criar entrada para notas sem texto (pode ser uma ação do sistema)
        historyEntries.push({
          id: note.id,
          text: 'Ação registrada',
          userName: note.createdBy?.name || 'Sistema',
          date: formatDate(note.createdAt),
          type: 'note'
        })
        return
      }

      const text = note.text.toLowerCase()
      const userName = note.createdBy?.name || 'Usuário'
      const date = formatDate(note.createdAt)

      let entry: HistoryEntry | null = null

      // Detectar movimentação entre fases
      if (text.includes('movido de') && text.includes('para')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'moved'
        }
      }
      // Detectar alteração de título
      else if (text.includes('título alterado') || text.includes('titulo alterado')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'description_changed' // Usando description_changed como tipo genérico para mudanças
        }
      }
      // Detectar alteração de valor
      else if (text.includes('valor atribuído alterado') || 
               text.includes('valor alterado') ||
               text.includes('valor atribuido alterado')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'value_changed'
        }
      }
      // Detectar alteração de descrição
      else if (text.includes('descrição alterada') || text.includes('descricao alterada')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'description_changed'
        }
      }
      // Outras notas - SEMPRE criar entrada, mesmo que não seja um tipo específico
      else {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'note'
        }
      }

      // Sempre adicionar a entrada se ela existir
      if (entry) {
        historyEntries.push(entry)
      }
    })

    // Ordenar por data/hora (mais antigo primeiro para mostrar cronologicamente)
    historyEntries.sort((a, b) => {
      // Usar a data ISO original para comparação mais precisa
      const dateA = a.type === 'created' && card.createdAt 
        ? new Date(card.createdAt).getTime()
        : notes.find(n => n.id === a.id)?.createdAt 
          ? new Date(notes.find(n => n.id === a.id)!.createdAt).getTime()
          : new Date(a.date).getTime()
      
      const dateB = b.type === 'created' && card.createdAt
        ? new Date(card.createdAt).getTime()
        : notes.find(n => n.id === b.id)?.createdAt
          ? new Date(notes.find(n => n.id === b.id)!.createdAt).getTime()
          : new Date(b.date).getTime()
      
      return dateA - dateB
    })

    console.log('buildHistory: Histórico final', { 
      entriesCount: historyEntries.length,
      entries: historyEntries 
    })

    setHistory(historyEntries)
  }

  if (!open) return null

  return (
    <>
      <button 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] cursor-default" 
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>
      
      <div className="fixed inset-4 md:inset-8 lg:inset-12 max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
            {card?.title || 'Carregando...'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Descrição */}
              {card?.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                    Descrição
                  </h3>
                  <p className="text-gray-900 dark:text-white font-secondary">
                    {card.description}
                  </p>
                </div>
              )}

              {/* Contatos */}
              {card?.contactIds && card.contactIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-secondary">
                    Contatos
                  </h3>
                  {isLoadingContacts ? (
                    <div className="text-sm text-gray-500">Carregando contatos...</div>
                  ) : contacts.length > 0 ? (
                    <div className="space-y-3">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                            {getInitials(contact.name || '')}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {contact.name}
                            </p>
                            {contact.phoneNumber && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {contact.phoneNumber}
                              </p>
                            )}
                          </div>
                          {/* Tipo do contato - tags */}
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.map((tag, idx) => (
                                <span
                                  key={tag.id || idx}
                                  className="px-2 py-1 text-xs font-medium rounded"
                                  style={{
                                    backgroundColor: tag.bgColor || '#dbeafe',
                                    color: tag.textColor || '#1e40af'
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              CONTATO
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum contato encontrado</p>
                  )}
                </div>
              )}

              {/* Valor Atribuído */}
              {card?.monetaryAmount !== null && card?.monetaryAmount !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                    Valor atribuído
                  </h3>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(card.monetaryAmount)}
                  </p>
                </div>
              )}

              {/* Mover para Fase */}
              {panel?.steps && panel.steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                    Fase
                  </h3>
                  <select
                    value={selectedStepId}
                    onChange={(e) => handleMoveToStep(e.target.value)}
                    disabled={isMoving}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(panel.steps as PanelStep[])
                      .filter((step): step is PanelStep => step && typeof step === 'object' && 'id' in step && 'title' in step)
                      .filter(step => !step.archived)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.title}
                        </option>
                      ))}
                  </select>
                  {isMoving && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Movendo card...
                    </p>
                  )}
                </div>
              )}

              {/* Histórico */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-secondary">
                  Histórico
                </h3>
                {isLoadingNotes ? (
                  <div className="text-sm text-gray-500">Carregando histórico...</div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500"
                      >
                        <p className="text-sm text-gray-900 dark:text-white mb-2 font-medium">
                          {entry.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.userName} em {entry.date}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum histórico disponível</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

