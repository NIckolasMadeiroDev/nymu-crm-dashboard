import { HelenaApiClient } from './helena-api-client'
import type { HelenaContact, HelenaApiListResponse } from '@/types/helena'

export class HelenaContactsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllContacts(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<HelenaContact[]> {
    try {
      const queryParams: Record<string, string> = {}

      if (params?.page) {
        queryParams.page = params.page.toString()
      }
      if (params?.limit) {
        queryParams.limit = params.limit.toString()
      }
      if (params?.search) {
        queryParams.search = params.search
      }

      const response = await this.apiClient.get<HelenaApiListResponse<HelenaContact>>(
        '/contacts',
        queryParams
      )

      return response.data || []
    } catch (error) {
      console.error('Error fetching contacts from Helena API:', error)
      throw error
    }
  }

  async getContactById(id: string): Promise<HelenaContact> {
    try {
      return await this.apiClient.get<HelenaContact>(`/contacts/${id}`)
    } catch (error) {
      console.error(`Error fetching contact ${id} from Helena API:`, error)
      throw error
    }
  }

  async searchContacts(query: string): Promise<HelenaContact[]> {
    return this.getAllContacts({ search: query })
  }
}

