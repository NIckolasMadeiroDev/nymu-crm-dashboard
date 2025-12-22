import { HelenaApiClient } from './helena-api-client'
import type { HelenaTeam, HelenaChannel, HelenaApiListResponse } from '@/types/helena'

export class HelenaTeamsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllTeams(): Promise<HelenaTeam[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaTeam>>('team')
      return response.data || []
    } catch (error) {
      console.error('Error fetching teams from Helena API:', error)
      throw error
    }
  }

  async getTeamById(id: string): Promise<HelenaTeam> {
    try {
      return await this.apiClient.get<HelenaTeam>(`team/${id}`)
    } catch (error) {
      console.error(`Error fetching team ${id} from Helena API:`, error)
      throw error
    }
  }

  async createTeam(team: Partial<HelenaTeam>): Promise<HelenaTeam> {
    try {
      return await this.apiClient.post<HelenaTeam>('team', team)
    } catch (error) {
      console.error('Error creating team in Helena API:', error)
      throw error
    }
  }

  async updateTeam(id: string, team: Partial<HelenaTeam>): Promise<HelenaTeam> {
    try {
      return await this.apiClient.put<HelenaTeam>(`team/${id}`, team)
    } catch (error) {
      console.error(`Error updating team ${id} in Helena API:`, error)
      throw error
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`team/${id}`)
    } catch (error) {
      console.error(`Error deleting team ${id} from Helena API:`, error)
      throw error
    }
  }

  async updateTeamUsers(id: string, userIds: string[]): Promise<HelenaTeam> {
    try {
      return await this.apiClient.put<HelenaTeam>(`team/${id}/user`, { userIds })
    } catch (error) {
      console.error(`Error updating users for team ${id}:`, error)
      throw error
    }
  }

  async getTeamChannels(id: string): Promise<HelenaChannel[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaChannel>>(
        `team/${id}/channel`
      )
      return response.data || []
    } catch (error) {
      console.error(`Error fetching channels for team ${id}:`, error)
      throw error
    }
  }
}

