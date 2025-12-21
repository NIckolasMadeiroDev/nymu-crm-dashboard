import { HelenaApiClient } from './helena-api-client'
import type { HelenaPartner, HelenaApiListResponse } from '@/types/helena'

export class HelenaPartnersService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllPartners(): Promise<HelenaPartner[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaPartner>>(
        '/partners'
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching partners from Helena API:', error)
      throw error
    }
  }

  async getPartnerById(id: string): Promise<HelenaPartner> {
    try {
      return await this.apiClient.get<HelenaPartner>(`/partners/${id}`)
    } catch (error) {
      console.error(`Error fetching partner ${id} from Helena API:`, error)
      throw error
    }
  }

  async getPartnerBillingReport(partnerId: string, params?: {
    period?: string
    startDate?: string
    endDate?: string
  }): Promise<HelenaPartner['billingReport']> {
    try {
      const queryParams: Record<string, string> = {}
      if (params?.period) {
        queryParams.period = params.period
      }
      if (params?.startDate) {
        queryParams.startDate = params.startDate
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate
      }

      return await this.apiClient.get<HelenaPartner['billingReport']>(
        `/partners/${partnerId}/billing-report`,
        queryParams
      )
    } catch (error) {
      console.error(`Error fetching billing report for partner ${partnerId}:`, error)
      throw error
    }
  }
}

