'use client'

import { useState, useEffect, useCallback } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import type { HelenaCard } from '@/types/helena'
import type { HelenaCardNote } from '@/services/helena/helena-cards-service'
import type { HelenaContact } from '@/types/helena'
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
  const [isLoadingResponsible, setIsLoadingResponsible] = useState(false)
  const [currentResponsibleUser, setCurrentResponsibleUser] = useState<{ id: string; name: string } | null>(null)

  const fetchCardDetails = useCallback(async () => {
    // Garantir que o loading está ativo antes de começar
    setIsLoading(true)
    setIsLoadingResponsible(true)
    // Limpar dados antigos imediatamente
    setCard(null)
    setCurrentResponsibleUser(null)
    
    try {
      const cardsService = helenaServiceFactory.getCardsService()

      const data = await cardsService.getCardById(cardId, ['responsibleUser'])
      setCard(data)
      
      // Sempre tentar obter o nome do responsável
      if (data.responsibleUser && data.responsibleUser.name) {
        // Se já veio populado com nome, usar diretamente
        setCurrentResponsibleUser(data.responsibleUser)
        setIsLoadingResponsible(false)
      } else if (data.responsibleUserId) {
        // Se não veio populado mas temos o ID, buscar o usuário
        try {
          const usersService = helenaServiceFactory.getUsersService()
          const user = await usersService.getUserById(data.responsibleUserId)
          if (user && user.name) {
            setCurrentResponsibleUser({ id: user.id, name: user.name })
          } else {
            // Se o usuário não tem nome, tentar buscar todos os usuários e encontrar pelo ID
            const allUsers = await usersService.getAllUsers()
            const foundUser = allUsers.find(u => u.id === data.responsibleUserId)
            if (foundUser && foundUser.name) {
              setCurrentResponsibleUser({ id: foundUser.id, name: foundUser.name })
            } else {
              setCurrentResponsibleUser(null)
            }
          }
        } catch (error) {
          console.error('Erro ao buscar usuário responsável:', error)
          // Tentar buscar todos os usuários como fallback
          try {
            const usersService = helenaServiceFactory.getUsersService()
            const allUsers = await usersService.getAllUsers()
            const foundUser = allUsers.find(u => u.id === data.responsibleUserId)
            if (foundUser && foundUser.name) {
              setCurrentResponsibleUser({ id: foundUser.id, name: foundUser.name })
            } else {
              setCurrentResponsibleUser(null)
            }
          } catch (fallbackError) {
            console.error('Erro ao buscar todos os usuários:', fallbackError)
            setCurrentResponsibleUser(null)
          }
        } finally {
          setIsLoadingResponsible(false)
        }
      } else {
        setCurrentResponsibleUser(null)
        setIsLoadingResponsible(false)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do card:', error)
      setIsLoadingResponsible(false)
    } finally {
      setIsLoading(false)
    }
  }, [cardId])

  const fetchPanel = useCallback(async () => {
    try {
      const panelsService = helenaServiceFactory.getPanelsService()
      const data = await panelsService.getPanelById(panelId, ['steps'])
      setPanel(data)
    } catch (error) {
      console.error('Erro ao carregar painel:', error)
    }
  }, [panelId])

  const fetchContacts = useCallback(async () => {
    if (!card?.contactIds || card.contactIds.length === 0) {
      setContacts([])
      return
    }

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
  }, [card])

  const handleMoveToStep = async (newStepId: string) => {
    if (!card || !panel || newStepId === card.stepId) return

    setIsMoving(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()


      const steps = (panel.steps as PanelStep[]) || []
      const currentStep = steps.find(s => s.id === card.stepId)
      const newStep = steps.find(s => s.id === newStepId)


      await cardsService.moveCardToStep(cardId, newStepId)


      try {
        await cardsService.addCardNote(cardId, {
          text: `Item movido de ${currentStep?.title || 'uma fase'} para ${newStep?.title || 'outra fase'}`
        })
      } catch (noteError) {
        console.warn('Erro ao adicionar nota de movimentação:', noteError)

      }


      const updatedCard = await cardsService.getCardById(cardId)
      setCard(updatedCard)
      setSelectedStepId(newStepId)


      await fetchNotes()


      onUpdate()
    } catch (error) {
      console.error('Erro ao mover card:', error)
      alert('Erro ao mover card. Tente novamente.')
    } finally {
      setIsMoving(false)
    }
  }

  const fetchNotes = useCallback(async () => {
    setIsLoadingNotes(true)
    try {
      const cardsService = helenaServiceFactory.getCardsService()

      const response = await cardsService.listCardNotes(cardId, {
        PageSize: 100,
        OrderBy: 'CreatedAt',
        OrderDirection: 'ASCENDING' // Mudado para ASCENDING para facilitar ordenação
      })

      const allNotes = response.items || []
      setNotes(allNotes)
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
      setNotes([]) // Garantir que sempre temos um array
    } finally {
      setIsLoadingNotes(false)
    }
  }, [cardId])

  useEffect(() => {
    if (open && cardId && panelId) {
      // Resetar estados quando o modal abre para evitar mostrar dados antigos
      setCard(null)
      setPanel(null)
      setContacts([])
      setNotes([])
      setHistory([])
      setCurrentResponsibleUser(null)
      setSelectedStepId('')
      setIsLoading(true)
      setIsLoadingContacts(false)
      setIsLoadingNotes(false)
      setIsLoadingResponsible(false)
      
      // Carregar dados
      fetchCardDetails()
      fetchNotes()
      fetchPanel()
    } else if (!open) {
      // Limpar estados quando o modal fecha
      setCard(null)
      setPanel(null)
      setContacts([])
      setNotes([])
      setHistory([])
      setCurrentResponsibleUser(null)
      setSelectedStepId('')
    }
  }, [open, cardId, panelId, fetchCardDetails, fetchNotes, fetchPanel])

  useEffect(() => {


    if (card && panel && !isLoadingNotes) {
      setSelectedStepId(card.stepId || '')
      buildHistory()
    }

  }, [card, notes, panel, isLoadingNotes])

  useEffect(() => {
    if (card && card.contactIds && card.contactIds.length > 0) {
      fetchContacts()
    } else {
      setContacts([])
    }
  }, [card, fetchContacts])

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

    const historyEntries: HistoryEntry[] = []


    if (card.createdAt) {

      let initialStepTitle = 'uma fase'
      if (panel.steps && Array.isArray(panel.steps)) {
        const steps = (panel.steps as PanelStep[])
          .filter(s => s && !s.archived)
          .sort((a, b) => (a.position || 0) - (b.position || 0))


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



    notes.forEach((note) => {

      if (!note.text || note.text.trim() === '') {

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


      if (text.includes('movido de') && text.includes('para')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'moved'
        }
      }

      else if (text.includes('título alterado') || text.includes('titulo alterado')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'description_changed' // Usando description_changed como tipo genérico para mudanças
        }
      }

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

      else if (text.includes('descrição alterada') || text.includes('descricao alterada')) {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'description_changed'
        }
      }

      else {
        entry = {
          id: note.id,
          text: note.text,
          userName,
          date,
          type: 'note'
        }
      }


      if (entry) {
        historyEntries.push(entry)
      }
    })


    historyEntries.sort((a, b) => {

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


        <div className="flex-1 overflow-y-auto p-6">
          {isLoading || !card ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando detalhes do card...</p>
            </div>
          ) : (
            <div className="space-y-6">

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

              {/* Responsável atual do card */}
              {(card?.responsibleUserId || card?.responsibleUser || currentResponsibleUser || isLoadingResponsible) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                    Responsável
                  </h3>
                  {isLoadingResponsible ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                  ) : currentResponsibleUser || card?.responsibleUser ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-semibold text-sm">
                        {getInitials((card?.responsibleUser?.name || currentResponsibleUser?.name) || '')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {card?.responsibleUser?.name || currentResponsibleUser?.name || 'Não atribuído'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Responsável atual
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 font-semibold text-sm">
                        ?
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-500 dark:text-gray-400">
                          Não atribuído
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Nenhum responsável atribuído
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

