import { HelenaApiClient } from './helena-api-client'
import type { HelenaAccount, HelenaApiListResponse } from '@/types/helena'

export class HelenaAccountsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllAccounts(): Promise<HelenaAccount[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaAccount>>(
        'account'
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching accounts from Helena API:', error)
      throw error
    }
  }

  async getAccountById(id: string): Promise<HelenaAccount> {
    try {
      return await this.apiClient.get<HelenaAccount>(`account/${id}`)
    } catch (error) {
      console.error(`Error fetching account ${id} from Helena API:`, error)
      throw error
    }
  }

  async createAccount(account: Partial<HelenaAccount>): Promise<HelenaAccount> {
    try {
      return await this.apiClient.post<HelenaAccount>('account', account)
    } catch (error) {
      console.error('Error creating account in Helena API:', error)
      throw error
    }
  }

  async updateAccount(id: string, account: Partial<HelenaAccount>): Promise<HelenaAccount> {
    try {
      return await this.apiClient.put<HelenaAccount>(`account/${id}`, account)
    } catch (error) {
      console.error(`Error updating account ${id} in Helena API:`, error)
      throw error
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`account/${id}`)
    } catch (error) {
      console.error(`Error deleting account ${id} from Helena API:`, error)
      throw error
    }
  }

  async activateAccount(id: string): Promise<HelenaAccount> {
    try {
      return await this.apiClient.post<HelenaAccount>(`account/${id}/activate`)
    } catch (error) {
      console.error(`Error activating account ${id} in Helena API:`, error)
      throw error
    }
  }

  async getAccountTokens(accountId: string): Promise<Array<{ id: string; token: string }>> {
    try {
      return await this.apiClient.get<Array<{ id: string; token: string }>>(
        `account/${accountId}/token`
      )
    } catch (error) {
      console.error(`Error fetching tokens for account ${accountId}:`, error)
      throw error
    }
  }

  async createAccountToken(accountId: string): Promise<{ id: string; token: string }> {
    try {
      return await this.apiClient.post<{ id: string; token: string }>(
        `account/${accountId}/token`
      )
    } catch (error) {
      console.error(`Error creating token for account ${accountId}:`, error)
      throw error
    }
  }

  async deleteAccountToken(accountId: string, tokenId: string): Promise<void> {
    try {
      await this.apiClient.delete(`account/${accountId}/token/${tokenId}`)
    } catch (error) {
      console.error(`Error deleting token ${tokenId} for account ${accountId}:`, error)
      throw error
    }
  }
}

