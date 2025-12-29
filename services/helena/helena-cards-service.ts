import { HelenaApiClient } from './helena-api-client'
import { HelenaCard } from '@/types/helena'

export interface HelenaCardNote {
  id: string
  cardId: string
  text?: string | null
  fileUrls?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    name: string
  }
}

export interface HelenaCardsPaginatedResponse {
  items: HelenaCard[]
  totalItems: number
  totalPages: number
  hasMorePages: boolean
  pageNumber: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface HelenaNotesPaginatedResponse {
  items: HelenaCardNote[]
  totalItems: number
  totalPages: number
  hasMorePages: boolean
  pageNumber: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface HelenaCardsListFilters {
  PanelId: string
  StepId?: string
  ContactId?: string
  ResponsibleUserId?: string
  TextFilter?: string
  IncludeArchived?: boolean
  IncludeDetails?: string[]
  'CreatedAt.Before'?: string
  'CreatedAt.After'?: string
  'UpdatedAt.Before'?: string
  'UpdatedAt.After'?: string
  PageNumber?: number
  PageSize?: number
  OrderBy?: string
  OrderDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface HelenaCreateCardPayload {
  stepId: string
  title: string
  description?: string | null
  position?: number | null
  dueDate?: string | null
  responsibleUserId?: string | null
  tagIds?: string[] | null
  tagNames?: string[] | null
  contactIds?: string[] | null
  sessionId?: string | null
  monetaryAmount?: number | null
  customFields?: Record<string, any> | null
  metadata?: Record<string, any> | null
}

export interface HelenaUpdateCardPayload {
  fields?: string[] | null
  stepId?: string | null
  title?: string | null
  description?: string | null
  position?: number | null
  dueDate?: string | null
  responsibleUserId?: string | null
  tagIds?: string[] | null
  tagNames?: string[] | null
  contactIds?: string[] | null
  sessionId?: string | null
  monetaryAmount?: number | null
  archived?: boolean | null
  customFields?: Record<string, any> | null
  metadata?: Record<string, any> | null
}

export interface HelenaDuplicateCardPayload {
  copyToStepId?: string | null
  options?: {
    copyNotes?: boolean
    copyAttachments?: boolean
    copyCustomFields?: boolean
  }
}

export interface HelenaCreateNotePayload {
  text?: string | null
  fileUrls?: string[] | null
}

export interface HelenaNotesListFilters {
  'CreatedAt.Before'?: string
  'CreatedAt.After'?: string
  'UpdatedAt.Before'?: string
  'UpdatedAt.After'?: string
  PageNumber?: number
  PageSize?: number
  OrderBy?: string
  OrderDirection?: 'ASCENDING' | 'DESCENDING'
}

export class HelenaCardsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  /**
   * Lista cards com filtros
   */
  async listCards(filters: HelenaCardsListFilters): Promise<HelenaCardsPaginatedResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()))
        } else {
          params.append(key, value.toString())
        }
      }
    })

    return await this.apiClient.get<HelenaCardsPaginatedResponse>(
      `crm/v1/panel/card?${params.toString()}`
    )
  }

  /**
   * Cria um novo card
   */
  async createCard(payload: HelenaCreateCardPayload): Promise<HelenaCard> {
    return await this.apiClient.post<HelenaCard>('crm/v1/panel/card', payload)
  }

  /**
   * Obtém um card por ID
   */
  async getCardById(id: string, includeDetails?: string[]): Promise<HelenaCard> {
    const params = new URLSearchParams()
    
    if (includeDetails && includeDetails.length > 0) {
      includeDetails.forEach(detail => params.append('IncludeDetails', detail))
    }

    const queryString = params.toString()
    const endpoint = queryString 
      ? `crm/v1/panel/card/${id}?${queryString}`
      : `crm/v1/panel/card/${id}`

    return await this.apiClient.get<HelenaCard>(endpoint)
  }

  /**
   * Atualiza um card
   */
  async updateCard(id: string, payload: HelenaUpdateCardPayload): Promise<HelenaCard> {
    return await this.apiClient.put<HelenaCard>(`crm/v2/panel/card/${id}`, payload)
  }

  /**
   * Duplica um card
   */
  async duplicateCard(id: string, payload?: HelenaDuplicateCardPayload): Promise<HelenaCard> {
    return await this.apiClient.post<HelenaCard>(
      `crm/v1/panel/card/${id}/duplicate`,
      payload || {}
    )
        }

  /**
   * Lista anotações de um card
   */
  async listCardNotes(
    cardId: string,
    filters?: HelenaNotesListFilters
  ): Promise<HelenaNotesPaginatedResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString
      ? `crm/v1/panel/card/${cardId}/note?${queryString}`
      : `crm/v1/panel/card/${cardId}/note`

    return await this.apiClient.get<HelenaNotesPaginatedResponse>(endpoint)
  }

  /**
   * Adiciona uma anotação a um card
   */
  async addCardNote(cardId: string, payload: HelenaCreateNotePayload): Promise<HelenaCardNote> {
    return await this.apiClient.post<HelenaCardNote>(
      `crm/v1/panel/card/${cardId}/note`,
      payload
    )
  }

  /**
   * Remove uma anotação de um card
   */
  async removeCardNote(cardId: string, noteId: string): Promise<void> {
    await this.apiClient.delete(`crm/v1/panel/card/${cardId}/note/${noteId}`)
  }

  /**
   * Obtém todos os cards de um painel (até 100)
   */
  async getAllCardsByPanel(panelId: string, includeDetails?: string[]): Promise<HelenaCard[]> {
    const detailsToInclude = includeDetails || ['contactIds', 'tags']
    const allCards: HelenaCard[] = []
    let pageNumber = 1
    const pageSize = 100
    let hasMorePages = true

    while (hasMorePages) {
      const response = await this.listCards({
        IncludeDetails: detailsToInclude,
        PanelId: panelId,
        PageSize: pageSize,
        PageNumber: pageNumber,
        IncludeArchived: false
      })

      if (response.items && response.items.length > 0) {
        allCards.push(...response.items)
      }

      hasMorePages = response.hasMorePages || false
      pageNumber++

      if (pageNumber > response.totalPages) {
        break
      }
    }

    return allCards
  }

  /**
   * Obtém cards por etapa
   */
  async getCardsByStep(panelId: string, stepId: string): Promise<HelenaCard[]> {
    const response = await this.listCards({
      PanelId: panelId,
      StepId: stepId,
      PageSize: 100,
      IncludeArchived: false
    })
    return response.items
  }

  /**
   * Obtém cards por contato
   */
  async getCardsByContact(panelId: string, contactId: string): Promise<HelenaCard[]> {
    const response = await this.listCards({
      PanelId: panelId,
      ContactId: contactId,
      PageSize: 100
    })
    return response.items
  }

  /**
   * Obtém cards por responsável
   */
  async getCardsByResponsible(panelId: string, userId: string): Promise<HelenaCard[]> {
    const response = await this.listCards({
      PanelId: panelId,
      ResponsibleUserId: userId,
      PageSize: 100,
      IncludeArchived: false
    })
    return response.items
  }

  /**
   * Busca cards por texto
   */
  async searchCards(panelId: string, searchText: string): Promise<HelenaCard[]> {
    const response = await this.listCards({
      PanelId: panelId,
      TextFilter: searchText,
      PageSize: 100
    })
    return response.items
  }

  /**
   * Arquiva um card
   */
  async archiveCard(id: string): Promise<HelenaCard> {
    return await this.updateCard(id, {
      fields: ['archived'],
      archived: true
    })
  }

  /**
   * Desarquiva um card
   */
  async unarchiveCard(id: string): Promise<HelenaCard> {
    return await this.updateCard(id, {
      fields: ['archived'],
      archived: false
    })
  }

  /**
   * Move um card para outra etapa
   */
  async moveCardToStep(cardId: string, stepId: string): Promise<HelenaCard> {
    return await this.updateCard(cardId, {
      fields: ['stepId'],
      stepId
    })
  }

  /**
   * Atualiza o valor monetário de um card
   */
  async updateCardValue(cardId: string, monetaryAmount: number): Promise<HelenaCard> {
    return await this.updateCard(cardId, {
      fields: ['monetaryAmount'],
      monetaryAmount
    })
  }

  /**
   * Atualiza o responsável de um card
   */
  async updateCardResponsible(cardId: string, userId: string | null): Promise<HelenaCard> {
    return await this.updateCard(cardId, {
      fields: ['responsibleUserId'],
      responsibleUserId: userId
    })
  }

  /**
   * Atualiza a data de vencimento de um card
   */
  async updateCardDueDate(cardId: string, dueDate: string | null): Promise<HelenaCard> {
    return await this.updateCard(cardId, {
      fields: ['dueDate'],
      dueDate
    })
  }
}
