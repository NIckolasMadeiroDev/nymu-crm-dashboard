import { HelenaApiClient } from './helena-api-client'
import type { HelenaField, HelenaApiListResponse } from '@/types/helena'

export class HelenaFieldsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllFields(): Promise<HelenaField[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaField>>('/fields')
      return response.data || []
    } catch (error) {
      console.error('Error fetching fields from Helena API:', error)
      throw error
    }
  }

  async getContactCustomFields(): Promise<HelenaField[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaField>>(
        '/contacts/custom-fields'
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching contact custom fields from Helena API:', error)
      throw error
    }
  }

  async getPanelCustomFields(panelId: string): Promise<HelenaField[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaField>>(
        `/crm/panels/${panelId}/custom-fields`
      )
      return response.data || []
    } catch (error) {
      console.error(`Error fetching custom fields for panel ${panelId}:`, error)
      throw error
    }
  }
}

