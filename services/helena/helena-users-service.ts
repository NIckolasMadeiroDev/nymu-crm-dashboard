import { HelenaApiClient } from './helena-api-client'
import type { HelenaUser, HelenaTeam, HelenaApiListResponse } from '@/types/helena'

export class HelenaUsersService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllUsers(): Promise<HelenaUser[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaUser>>('/users')
      return response.data || []
    } catch (error) {
      console.error('Error fetching users from Helena API:', error)
      throw error
    }
  }

  async getUserById(id: string): Promise<HelenaUser> {
    try {
      return await this.apiClient.get<HelenaUser>(`/users/${id}`)
    } catch (error) {
      console.error(`Error fetching user ${id} from Helena API:`, error)
      throw error
    }
  }

  async createUser(user: Partial<HelenaUser>): Promise<HelenaUser> {
    try {
      return await this.apiClient.post<HelenaUser>('/users', user)
    } catch (error) {
      console.error('Error creating user in Helena API:', error)
      throw error
    }
  }

  async updateUser(id: string, user: Partial<HelenaUser>): Promise<HelenaUser> {
    try {
      return await this.apiClient.put<HelenaUser>(`/users/${id}`, user)
    } catch (error) {
      console.error(`Error updating user ${id} in Helena API:`, error)
      throw error
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/users/${id}`)
    } catch (error) {
      console.error(`Error deleting user ${id} from Helena API:`, error)
      throw error
    }
  }

  async updateUserTeams(id: string, teamIds: string[]): Promise<HelenaUser> {
    try {
      return await this.apiClient.post<HelenaUser>(`/users/${id}/teams`, { teamIds })
    } catch (error) {
      console.error(`Error updating teams for user ${id}:`, error)
      throw error
    }
  }

  async changeUserStatus(id: string, status: string): Promise<HelenaUser> {
    try {
      return await this.apiClient.post<HelenaUser>(`/users/${id}/status`, { status })
    } catch (error) {
      console.error(`Error changing status for user ${id}:`, error)
      throw error
    }
  }

  async logoutUserFromAllDevices(id: string): Promise<void> {
    try {
      await this.apiClient.post(`/users/${id}/logout-all`)
    } catch (error) {
      console.error(`Error logging out user ${id} from all devices:`, error)
      throw error
    }
  }
}

