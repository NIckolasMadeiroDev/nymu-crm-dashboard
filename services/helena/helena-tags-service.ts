import { HelenaApiClient } from './helena-api-client'
import type { HelenaTag, HelenaApiListResponse } from '@/types/helena'

export class HelenaTagsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllTags(): Promise<HelenaTag[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaTag>>('tag')
      return response.data || []
    } catch (error) {
      console.error('Error fetching tags from Helena API:', error)
      throw error
    }
  }

  async getTagById(id: string): Promise<HelenaTag> {
    try {
      return await this.apiClient.get<HelenaTag>(`tag/${id}`)
    } catch (error) {
      console.error(`Error fetching tag ${id} from Helena API:`, error)
      throw error
    }
  }
}

