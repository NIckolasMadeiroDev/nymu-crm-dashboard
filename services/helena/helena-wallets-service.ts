import { HelenaApiClient } from './helena-api-client'
import type { HelenaWallet, HelenaContact, HelenaApiListResponse } from '@/types/helena'

export class HelenaWalletsService {
  constructor(private apiClient: HelenaApiClient) {}

  async getAllWallets(): Promise<HelenaWallet[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaWallet>>(
        '/wallets'
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching wallets from Helena API:', error)
      throw error
    }
  }

  async getWalletById(id: string): Promise<HelenaWallet> {
    try {
      return await this.apiClient.get<HelenaWallet>(`/wallets/${id}`)
    } catch (error) {
      console.error(`Error fetching wallet ${id} from Helena API:`, error)
      throw error
    }
  }

  async getWalletContacts(walletId: string): Promise<HelenaContact[]> {
    try {
      const response = await this.apiClient.get<HelenaApiListResponse<HelenaContact>>(
        `/wallets/${walletId}/contacts`
      )
      return response.data || []
    } catch (error) {
      console.error(`Error fetching contacts for wallet ${walletId}:`, error)
      throw error
    }
  }

  async addContactToWallet(walletId: string, contactId: string): Promise<void> {
    try {
      await this.apiClient.post(`/wallets/${walletId}/contacts`, { contactId })
    } catch (error) {
      console.error(`Error adding contact to wallet ${walletId}:`, error)
      throw error
    }
  }

  async removeContactFromWallet(walletId: string, contactId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/wallets/${walletId}/contacts/${contactId}`)
    } catch (error) {
      console.error(`Error removing contact from wallet ${walletId}:`, error)
      throw error
    }
  }

  async addContactsToWallet(walletId: string, contactIds: string[]): Promise<void> {
    try {
      await this.apiClient.post(`/wallets/${walletId}/contacts/bulk`, { contactIds })
    } catch (error) {
      console.error(`Error adding contacts to wallet ${walletId}:`, error)
      throw error
    }
  }

  async removeContactsFromWallet(walletId: string, contactIds: string[]): Promise<void> {
    try {
      await this.apiClient.delete(`/wallets/${walletId}/contacts/bulk`, {
        body: JSON.stringify({ contactIds }),
      } as RequestInit)
    } catch (error) {
      console.error(`Error removing contacts from wallet ${walletId}:`, error)
      throw error
    }
  }
}

