import { HelenaApiClient } from './helena-api-client'

export interface HelenaTag {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  bgColor: string
  textColor: string
}

export class HelenaTagsListService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async listTags(): Promise<HelenaTag[]> {
    return this.apiClient.get<HelenaTag[]>('core/v1/tag')
  }
}

