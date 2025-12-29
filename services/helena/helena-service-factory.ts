import { HelenaApiClient } from './helena-api-client'
import { HelenaCardsService } from './helena-cards-service'
import { HelenaPanelsService } from './helena-panels-service'
import { HelenaContactsService } from './helena-contacts-service'
import { HelenaWalletsService } from './helena-wallets-service'
import { HelenaAccountsService } from './helena-accounts-service'
import { HelenaTeamsService } from './helena-teams-service'
import { HelenaTagsService } from './helena-tags-service'
import { HelenaBusinessHoursService } from './helena-business-hours-service'
import { HelenaPartnersService } from './helena-partners-service'
import { HelenaUsersService } from './helena-users-service'
import { HelenaFieldsService } from './helena-fields-service'
import { HelenaFilesService } from './helena-files-service'
import { HelenaMetricsService } from './helena-metrics-service'
import { HelenaDepartmentsService } from './helena-departments-service'
import { getHelenaApiConfig } from './helena-config'

class HelenaServiceFactory {
  private apiClient: HelenaApiClient | null = null
  private cardsService: HelenaCardsService | null = null
  private panelsService: HelenaPanelsService | null = null
  private contactsService: HelenaContactsService | null = null
  private walletsService: HelenaWalletsService | null = null
  private accountsService: HelenaAccountsService | null = null
  private teamsService: HelenaTeamsService | null = null
  private tagsService: HelenaTagsService | null = null
  private businessHoursService: HelenaBusinessHoursService | null = null
  private partnersService: HelenaPartnersService | null = null
  private usersService: HelenaUsersService | null = null
  private fieldsService: HelenaFieldsService | null = null
  private filesService: HelenaFilesService | null = null
  private metricsService: HelenaMetricsService | null = null
  private departmentsService: HelenaDepartmentsService | null = null

  private initializeServices(): void {
    if (this.apiClient) {
      return
    }

    try {
      const config = getHelenaApiConfig()
      this.apiClient = new HelenaApiClient(config)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Helena Service Factory] Services initialized successfully')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Helena Service Factory] Failed to initialize:', error)
      }
      throw error
    }
    this.cardsService = new HelenaCardsService(this.apiClient)
    this.panelsService = new HelenaPanelsService(this.apiClient)
    this.contactsService = new HelenaContactsService(this.apiClient)
    this.walletsService = new HelenaWalletsService(this.apiClient)
    this.accountsService = new HelenaAccountsService(this.apiClient)
    this.teamsService = new HelenaTeamsService(this.apiClient)
    this.tagsService = new HelenaTagsService(this.apiClient)
    this.businessHoursService = new HelenaBusinessHoursService(this.apiClient)
    this.partnersService = new HelenaPartnersService(this.apiClient)
    this.usersService = new HelenaUsersService(this.apiClient)
    this.fieldsService = new HelenaFieldsService(this.apiClient)
    this.filesService = new HelenaFilesService(this.apiClient)
    this.departmentsService = new HelenaDepartmentsService(this.apiClient)
    this.metricsService = new HelenaMetricsService(
      this.apiClient,
      this.cardsService,
      this.panelsService
    )
  }

  getCardsService(): HelenaCardsService {
    this.initializeServices()
    if (!this.cardsService) {
      throw new Error('Helena Cards Service not initialized')
    }
    return this.cardsService
  }

  getPanelsService(): HelenaPanelsService {
    this.initializeServices()
    if (!this.panelsService) {
      throw new Error('Helena Panels Service not initialized')
    }
    return this.panelsService
  }

  getContactsService(): HelenaContactsService {
    this.initializeServices()
    if (!this.contactsService) {
      throw new Error('Helena Contacts Service not initialized')
    }
    return this.contactsService
  }

  getWalletsService(): HelenaWalletsService {
    this.initializeServices()
    if (!this.walletsService) {
      throw new Error('Helena Wallets Service not initialized')
    }
    return this.walletsService
  }

  getAccountsService(): HelenaAccountsService {
    this.initializeServices()
    if (!this.accountsService) {
      throw new Error('Helena Accounts Service not initialized')
    }
    return this.accountsService
  }

  getTeamsService(): HelenaTeamsService {
    this.initializeServices()
    if (!this.teamsService) {
      throw new Error('Helena Teams Service not initialized')
    }
    return this.teamsService
  }

  getTagsService(): HelenaTagsService {
    this.initializeServices()
    if (!this.tagsService) {
      throw new Error('Helena Tags Service not initialized')
    }
    return this.tagsService
  }

  getBusinessHoursService(): HelenaBusinessHoursService {
    this.initializeServices()
    if (!this.businessHoursService) {
      throw new Error('Helena Business Hours Service not initialized')
    }
    return this.businessHoursService
  }

  getPartnersService(): HelenaPartnersService {
    this.initializeServices()
    if (!this.partnersService) {
      throw new Error('Helena Partners Service not initialized')
    }
    return this.partnersService
  }

  getUsersService(): HelenaUsersService {
    this.initializeServices()
    if (!this.usersService) {
      throw new Error('Helena Users Service not initialized')
    }
    return this.usersService
  }

  getFieldsService(): HelenaFieldsService {
    this.initializeServices()
    if (!this.fieldsService) {
      throw new Error('Helena Fields Service not initialized')
    }
    return this.fieldsService
  }

  getFilesService(): HelenaFilesService {
    this.initializeServices()
    if (!this.filesService) {
      throw new Error('Helena Files Service not initialized')
    }
    return this.filesService
  }

  getMetricsService(): HelenaMetricsService {
    this.initializeServices()
    if (!this.metricsService) {
      throw new Error('Helena Metrics Service not initialized')
    }
    return this.metricsService
  }

  getDepartmentsService(): HelenaDepartmentsService {
    this.initializeServices()
    if (!this.departmentsService) {
      throw new Error('Helena Departments Service not initialized')
    }
    return this.departmentsService
  }

  getApiClient(): HelenaApiClient {
    this.initializeServices()
    if (!this.apiClient) {
      throw new Error('Helena API Client not initialized')
    }
    return this.apiClient
  }
}

export const helenaServiceFactory = new HelenaServiceFactory()

