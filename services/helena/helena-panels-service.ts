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

export class HelenaPanelsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async listPanels(filters?: HelenaPanelsListFilters): Promise<HelenaPanelsPaginatedResponse> {
    const params: Record<string, any> = {}
    if (filters) {
      if (filters.Title) params.Title = filters.Title
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

  async getPanelById(id: string): Promise<HelenaPanel> {
    return this.apiClient.get<HelenaPanel>(`crm/v1/panel/${id}`)
  }
}