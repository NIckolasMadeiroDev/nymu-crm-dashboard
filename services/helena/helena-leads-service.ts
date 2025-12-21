import { HelenaApiClient } from './helena-api-client'
import type { HelenaLead, HelenaApiListResponse } from '@/types/helena'

export class HelenaLeadsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllLeads(params?: {
    page?: number
    limit?: number
    source?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<HelenaLead[]> {
    try {
      const queryParams: Record<string, string> = {}

      if (params?.page) {
        queryParams.page = params.page.toString()
      }
      if (params?.limit) {
        queryParams.limit = params.limit.toString()
      }
      if (params?.source) {
        queryParams.source = params.source
      }
      if (params?.status) {
        queryParams.status = params.status
      }
      if (params?.dateFrom) {
        queryParams.dateFrom = params.dateFrom
      }
      if (params?.dateTo) {
        queryParams.dateTo = params.dateTo
      }

      const response = await this.apiClient.get<HelenaApiListResponse<HelenaLead>>(
        '/leads',
        queryParams
      )

      return response.data || []
    } catch (error) {
      console.error('Error fetching leads from Helena API:', error)
      throw error
    }
  }

  async getLeadById(id: string): Promise<HelenaLead> {
    try {
      return await this.apiClient.get<HelenaLead>(`/leads/${id}`)
    } catch (error) {
      console.error(`Error fetching lead ${id} from Helena API:`, error)
      throw error
    }
  }

  async getLeadsBySource(source: string): Promise<HelenaLead[]> {
    return this.getAllLeads({ source })
  }

  async getLeadsByDateRange(dateFrom: string, dateTo: string): Promise<HelenaLead[]> {
    return this.getAllLeads({ dateFrom, dateTo })
  }
}

