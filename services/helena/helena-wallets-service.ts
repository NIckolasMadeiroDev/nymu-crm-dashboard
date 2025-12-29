import { HelenaApiClient } from './helena-api-client'
import type { HelenaWallet, HelenaContact, HelenaPaginatedResponse } from '@/types/helena'

export class HelenaWalletsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getAllWallets(): Promise<HelenaWallet[]> {
    try {
      const allWallets: HelenaWallet[] = []
      let pageNumber = 1
      const pageSize = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await this.apiClient.get<HelenaPaginatedResponse<HelenaWallet>>(
          'core/v1/portfolio',
          {
            PageNumber: pageNumber.toString(),
            PageSize: pageSize.toString(),
          }
        )

        if (response.items && response.items.length > 0) {
          allWallets.push(...response.items)
        }

        hasMorePages = response.hasMorePages || false
        pageNumber++

        if (pageNumber > response.totalPages) {
          break
        }
      }

      return allWallets
    } catch (error) {
      // Wallets endpoint may not be available, return empty array instead of throwing
      console.warn('Warning: Could not fetch wallets (endpoint may not be available):', error)
      return []
    }
  }

  async getWalletById(id: string): Promise<HelenaWallet> {
    try {
      return await this.apiClient.get<HelenaWallet>(`portfolio/${id}`)
    } catch (error) {
      console.error(`Error fetching wallet ${id} from Helena API:`, error)
      throw error
    }
  }

  async getWalletContacts(walletId: string): Promise<HelenaContact[]> {
    try {
      const allContacts: HelenaContact[] = []
      let pageNumber = 1
      const pageSize = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await this.apiClient.get<HelenaPaginatedResponse<HelenaContact>>(
          `portfolio/${walletId}/contact`,
          {
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
          }
        )

        if (response.items && response.items.length > 0) {
          allContacts.push(...response.items)
        }

        hasMorePages = response.hasMorePages || false
        pageNumber++

        if (pageNumber > response.totalPages) {
          break
        }
      }

      return allContacts
    } catch (error) {
      console.error(`Error fetching contacts for wallet ${walletId}:`, error)
      throw error
    }
  }

  async addContactToWallet(walletId: string, contactId: string): Promise<void> {
    try {
      await this.apiClient.post(`portfolio/${walletId}/contact`, { contactId })
    } catch (error) {
      console.error(`Error adding contact to wallet ${walletId}:`, error)
      throw error
    }
  }

  async removeContactFromWallet(walletId: string, contactId: string): Promise<void> {
    try {
      await this.apiClient.delete(`portfolio/${walletId}/contact`, { contactId })
    } catch (error) {
      console.error(`Error removing contact from wallet ${walletId}:`, error)
      throw error
    }
  }

  async addContactsToWallet(walletId: string, contactIds: string[]): Promise<void> {
    try {
      await this.apiClient.post(`portfolio/${walletId}/contact/batch`, { contactIds })
    } catch (error) {
      console.error(`Error adding contacts to wallet ${walletId}:`, error)
      throw error
    }
  }

  async removeContactsFromWallet(walletId: string, contactIds: string[]): Promise<void> {
    try {
      await this.apiClient.delete(`portfolio/${walletId}/contact/batch`, { contactIds })
    } catch (error) {
      console.error(`Error removing contacts from wallet ${walletId}:`, error)
      throw error
    }
  }
}

