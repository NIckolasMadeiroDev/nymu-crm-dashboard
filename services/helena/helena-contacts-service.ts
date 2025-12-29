import { HelenaApiClient } from './helena-api-client'
import type { HelenaContact } from '@/types/helena'
export type { HelenaContact }

export interface HelenaContactsPaginatedResponse {
  items: HelenaContact[]
  totalItems: number
  totalPages: number
  hasMorePages: boolean
  pageNumber: number
  pageSize: number
  orderBy?: string
  orderDirection?: string
}

export interface HelenaContactsListFilters {
  IncludeDetails?: string[]
  Status?: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'
  'CreatedAt.Before'?: string
  'CreatedAt.After'?: string
  'UpdatedAt.Before'?: string
  'UpdatedAt.After'?: string
  PageNumber?: number
  PageSize?: number
  OrderBy?: string
  OrderDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface HelenaContactsFilterParams {
  textFilter?: string
  tagIds?: string[]
  customFieldFilters?: Array<{
    customFieldId: string
    value: string
  }>
  pageNumber?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface HelenaContactTagsPayload {
  action: 'ReplaceAll' | 'Upsert' | 'Remove'
  items: Array<{ tagId: string }>
}

export interface HelenaBatchContact {
  name: string
  phoneNumber: string
  email?: string
  customFields?: Record<string, any>
}

export interface HelenaCustomField {
  id: string
  createdAt: string
  updatedAt: string
  companyId: string
  name: string
  type: string
  options?: string[]
}

export class HelenaContactsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async listContacts(filters?: HelenaContactsListFilters): Promise<HelenaContactsPaginatedResponse> {
    const params: Record<string, any> = {}
    if (filters) {
      if (filters.IncludeDetails) params.IncludeDetails = filters.IncludeDetails
      if (filters.Status) params.Status = filters.Status
      if (filters['CreatedAt.Before']) params['CreatedAt.Before'] = filters['CreatedAt.Before']
      if (filters['CreatedAt.After']) params['CreatedAt.After'] = filters['CreatedAt.After']
      if (filters['UpdatedAt.Before']) params['UpdatedAt.Before'] = filters['UpdatedAt.Before']
      if (filters['UpdatedAt.After']) params['UpdatedAt.After'] = filters['UpdatedAt.After']
      if (filters.PageNumber) params.PageNumber = filters.PageNumber
      if (filters.PageSize) params.PageSize = filters.PageSize
      if (filters.OrderBy) params.OrderBy = filters.OrderBy
      if (filters.OrderDirection) params.OrderDirection = filters.OrderDirection
    }
    return this.apiClient.get<HelenaContactsPaginatedResponse>('core/v1/contact', params)
  }

  async filterContacts(filters: HelenaContactsFilterParams): Promise<HelenaContactsPaginatedResponse> {
    return this.apiClient.post<HelenaContactsPaginatedResponse>('core/v1/contact/filter', filters)
  }

  async createContact(payload: Partial<HelenaContact>): Promise<HelenaContact> {
    return this.apiClient.post<HelenaContact>('core/v1/contact', payload)
  }

  async getContactByPhone(phone: string, includeDetails?: string[]): Promise<HelenaContact> {
    const params: Record<string, any> = {}
    if (includeDetails) params.IncludeDetails = includeDetails
    return this.apiClient.get<HelenaContact>(`core/v1/contact/phonenumber/${phone}`, params)
  }

  async updateContactByPhone(phone: string, payload: Partial<HelenaContact> & { fields?: string[] }): Promise<HelenaContact> {
    return this.apiClient.put<HelenaContact>(`core/v1/contact/phonenumber/${phone}`, payload)
  }

  async getContactById(id: string, includeDetails?: string[]): Promise<HelenaContact> {
    const params: Record<string, any> = {}
    if (includeDetails) params.IncludeDetails = includeDetails
    return this.apiClient.get<HelenaContact>(`core/v1/contact/${id}`, params)
  }

  async updateContactById(id: string, payload: Partial<HelenaContact> & { fields?: string[] }): Promise<HelenaContact> {
    return this.apiClient.put<HelenaContact>(`core/v1/contact/${id}`, payload)
  }

  async updateTagsByPhone(phone: string, payload: HelenaContactTagsPayload): Promise<any> {
    return this.apiClient.post<any>(`core/v1/contact/phonenumber/${phone}/tags`, payload)
  }

  async updateTagsById(id: string, payload: HelenaContactTagsPayload): Promise<any> {
    return this.apiClient.post<any>(`core/v1/contact/${id}/tags`, payload)
  }

  async batchSaveContacts(items: HelenaBatchContact[]): Promise<any> {
    return this.apiClient.post<any>('core/v2/contact/batch', { items })
  }

  async getCustomFields(): Promise<HelenaCustomField[]> {
    return this.apiClient.get<HelenaCustomField[]>('core/v1/contact/custom-field')
  }

  async deleteContactById(id: string): Promise<void> {
    await this.apiClient.delete(`core/v1/contact/${id}`)
  }

  async getAllContacts(includeDetails?: string[]): Promise<HelenaContact[]> {
    const allContacts: HelenaContact[] = []
    let pageNumber = 1
    const pageSize = 100
    let hasMorePages = true

    const detailsToInclude = includeDetails || ['tags', 'customFields']

    while (hasMorePages) {
      const response = await this.listContacts({
        IncludeDetails: detailsToInclude,
        PageSize: pageSize,
        PageNumber: pageNumber,
      })

      if (response.items && response.items.length > 0) {
        allContacts.push(...response.items)
      }

      hasMorePages = response.hasMorePages || false
      pageNumber++

      if (pageNumber > response.totalPages) {
        break
      }
    }

    return allContacts
  }
}
