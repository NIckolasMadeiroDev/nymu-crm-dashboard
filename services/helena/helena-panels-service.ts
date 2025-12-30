import { HelenaApiClient } from './helena-api-client'

export interface HelenaPanel {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  archived: boolean;
  scope: string;
  departmentIds: string[] | null;
  userId: string;
  title: string;
  description: string;
  thumbnailId: string | null;
  thumbnailFile: string | null;
  key: string;
  overdueCardCount: number;
  stepTitles: string[] | null;
  tags: string[] | null;
  steps: any[] | null;
}

export interface HelenaPanelsPaginatedResponse {
  items: HelenaPanel[];
  totalItems: number;
  totalPages: number;
  hasMorePages: boolean;
  pageNumber: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: string;
}

export interface HelenaPanelsListFilters {
  Title?: string
  IncludeDetails?: string[]
  CreatedAt_Before?: string
  CreatedAt_After?: string
  UpdatedAt_Before?: string
  UpdatedAt_After?: string
  PageNumber?: number
  PageSize?: number
  OrderBy?: string
  OrderDirection?: 'ASCENDING'|'DESCENDING'
}

export interface HelenaPanelCustomField {
  id: string
  key: string
  name: string
  type: string
  required?: boolean
  options?: string[]
  groupId?: string
  groupName?: string
  order?: number
}

export interface PanelStep {
  id?: string
  title: string
  position: number
  isInitial: boolean
  isFinal: boolean
  archived?: boolean
  color?: string
  cardCount?: number
  overdueCardCount?: number
  monetaryAmount?: number
}

export interface CreatePanelPayload {
  title: string
  key?: string
  description?: string
  scope: 'PERSONAL' | 'DEPARTMENT'
  departmentIds?: string[]
  isRestrictedService?: boolean
  viewType?: 'ALL' | 'INDIVIDUAL'
}

export interface UpdatePanelPayload {
  title?: string
  key?: string
  description?: string
  scope?: 'PERSONAL' | 'DEPARTMENT'
  departmentIds?: string[]
  isRestrictedService?: boolean
  viewType?: 'ALL' | 'INDIVIDUAL'
  archived?: boolean
}

export class HelenaPanelsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  /**
   * Lista painéis com filtros
   */
  async listPanels(filters?: HelenaPanelsListFilters): Promise<HelenaPanelsPaginatedResponse> {
    const params: Record<string, any> = {}
    if (filters) {
      if (filters.Title) params.Title = filters.Title
      // IncludeDetails as array will be handled by apiClient.get to create multiple parameters
      if (filters.IncludeDetails) params.IncludeDetails = filters.IncludeDetails
      if (filters.CreatedAt_Before) params.CreatedAt_Before = filters.CreatedAt_Before
      if (filters.CreatedAt_After) params.CreatedAt_After = filters.CreatedAt_After
      if (filters.UpdatedAt_Before) params.UpdatedAt_Before = filters.UpdatedAt_Before
      if (filters.UpdatedAt_After) params.UpdatedAt_After = filters.UpdatedAt_After
      if (filters.PageNumber) params.PageNumber = filters.PageNumber
      if (filters.PageSize) params.PageSize = filters.PageSize
      if (filters.OrderBy) params.OrderBy = filters.OrderBy
      if (filters.OrderDirection) params.OrderDirection = filters.OrderDirection
    }
    return this.apiClient.get<HelenaPanelsPaginatedResponse>('crm/v1/panel', params)
  }

  /**
   * Obtém um painel por ID
   */
  async getPanelById(id: string, includeDetails?: string[]): Promise<HelenaPanel> {
    const params = new URLSearchParams()
    
    if (includeDetails && includeDetails.length > 0) {
      includeDetails.forEach(detail => params.append('IncludeDetails', detail))
    }

    const queryString = params.toString()
    const endpoint = queryString 
      ? `crm/v1/panel/${id}?${queryString}`
      : `crm/v1/panel/${id}`

    return this.apiClient.get<HelenaPanel>(endpoint)
  }

  /**
   * Obtém campos personalizados de um painel
   */
  async getPanelCustomFields(
    id: string, 
    nestedList: boolean = false
  ): Promise<HelenaPanelCustomField[]> {
    const params = new URLSearchParams()
    params.append('NestedList', nestedList.toString())

    return this.apiClient.get<HelenaPanelCustomField[]>(
      `crm/v1/panel/${id}/custom-fields?${params.toString()}`
    )
  }

  /**
   * Obtém todos os painéis (até 100)
   */
  async getAllPanels(): Promise<HelenaPanel[]> {
    const response = await this.listPanels({ PageSize: 100 })
    return response.items
  }

  /**
   * Busca painéis por título
   */
  async searchPanelsByTitle(title: string): Promise<HelenaPanel[]> {
    const response = await this.listPanels({ 
      Title: title,
      PageSize: 100 
    })
    return response.items
  }

  /**
   * Obtém painéis com detalhes completos (incluindo steps)
   * Busca todas as páginas para garantir dados completos
   */
  async getPanelsWithDetails(): Promise<HelenaPanel[]> {
    const allPanels: HelenaPanel[] = []
    let pageNumber = 1
    const pageSize = 100
    let hasMorePages = true

    while (hasMorePages) {
      const response = await this.listPanels({ 
        IncludeDetails: ['steps', 'tags'],
        PageSize: pageSize,
        PageNumber: pageNumber
      })

      if (response.items && response.items.length > 0) {
        allPanels.push(...response.items)
      }

      hasMorePages = response.hasMorePages || false
      pageNumber++

      if (pageNumber > response.totalPages) {
        break
      }
    }

    return allPanels
  }

  /**
   * Obtém um painel com todos os detalhes
   */
  async getPanelWithFullDetails(id: string): Promise<HelenaPanel> {
    return this.getPanelById(id, ['steps', 'tags', 'customFields'])
  }

  /**
   * Cria um novo painel
   */
  async createPanel(payload: CreatePanelPayload): Promise<HelenaPanel> {
    return this.apiClient.post<HelenaPanel>('crm/v1/panel', payload)
  }

  /**
   * Atualiza um painel existente
   */
  async updatePanel(id: string, payload: UpdatePanelPayload): Promise<HelenaPanel> {
    return this.apiClient.put<HelenaPanel>(`crm/v1/panel/${id}`, payload)
  }

  /**
   * Arquiva um painel
   */
  async archivePanel(id: string): Promise<HelenaPanel> {
    return this.updatePanel(id, { archived: true })
  }

  /**
   * Desarquiva um painel
   */
  async unarchivePanel(id: string): Promise<HelenaPanel> {
    return this.updatePanel(id, { archived: false })
  }

  /**
   * Cria uma nova etapa/fase em um painel
   */
  async createPanelStep(panelId: string, step: Partial<PanelStep>): Promise<any> {
    return this.apiClient.post(`crm/v1/panel/${panelId}/step`, step)
  }

  /**
   * Atualiza uma etapa/fase de um painel
   */
  async updatePanelStep(panelId: string, stepId: string, step: Partial<PanelStep>): Promise<any> {
    return this.apiClient.put(`crm/v1/panel/${panelId}/step/${stepId}`, step)
  }

  /**
   * Arquiva/Remove uma etapa/fase de um painel
   */
  async deletePanelStep(panelId: string, stepId: string): Promise<void> {
    return this.apiClient.put(`crm/v1/panel/${panelId}/step/${stepId}`, { archived: true })
  }
}