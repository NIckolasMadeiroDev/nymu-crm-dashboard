import { HelenaApiClient } from './helena-api-client'
import type { HelenaFile } from '@/types/helena'

export class HelenaFilesService {
  constructor(private apiClient: HelenaApiClient) {}

  async getUploadUrl(params?: {
    filename?: string
    contentType?: string
    size?: number
  }): Promise<{ uploadUrl: string; fileId: string }> {
    try {
      return await this.apiClient.post<{ uploadUrl: string; fileId: string }>(
        '/files/upload-url',
        params
      )
    } catch (error) {
      console.error('Error getting upload URL from Helena API:', error)
      throw error
    }
  }

  async saveFile(fileId: string, metadata?: {
    name?: string
    description?: string
  }): Promise<HelenaFile> {
    try {
      return await this.apiClient.post<HelenaFile>(`/files/${fileId}/save`, metadata)
    } catch (error) {
      console.error(`Error saving file ${fileId} in Helena API:`, error)
      throw error
    }
  }

  async getFileById(id: string): Promise<HelenaFile> {
    try {
      return await this.apiClient.get<HelenaFile>(`/files/${id}`)
    } catch (error) {
      console.error(`Error fetching file ${id} from Helena API:`, error)
      throw error
    }
  }
}

