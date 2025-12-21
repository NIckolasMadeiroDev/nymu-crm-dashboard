import { HelenaApiClient } from './helena-api-client'
import type { HelenaBusinessHours } from '@/types/helena'

export class HelenaBusinessHoursService {
  constructor(private apiClient: HelenaApiClient) {}

  async getBusinessHours(): Promise<HelenaBusinessHours> {
    try {
      return await this.apiClient.get<HelenaBusinessHours>('/business-hours')
    } catch (error) {
      console.error('Error fetching business hours from Helena API:', error)
      throw error
    }
  }
}

