/**
 * Helena API Services
 * 
 * Centralized exports for all Helena API service modules
 */

// API Client
export { HelenaApiClient } from './helena-api-client'
export type { HelenaApiConfig, HelenaApiResponse, HelenaApiError } from '@/types/helena'

// Configuration
export { getHelenaApiConfig, isHelenaApiEnabled } from './helena-config'

// Services
export { HelenaDepartmentsService } from './helena-departments-service'
export { HelenaTagsListService } from './helena-tags-list-service'
export { HelenaOfficeHoursService } from './helena-officehours-service'
export { HelenaAgentsService } from './helena-agents-service'
export { HelenaPanelsService } from './helena-panels-service'
export { HelenaContactsService } from './helena-contacts-service'
export { HelenaCardsService } from './helena-cards-service'
export { HelenaMetricsService } from './helena-metrics-service'

// Types - Departments
export type { 
  HelenaDepartment,
  HelenaDepartmentAgent
} from './helena-departments-service'

// Types - Tags
export type { HelenaTag } from './helena-tags-list-service'

// Types - Office Hours
export type {
  HelenaOfficeHours,
  HelenaOfficeHourDay,
  HelenaOfficeHourDayPeriod
} from './helena-officehours-service'

// Types - Agents
export type {
  HelenaAgent,
  HelenaAgentDepartment
} from './helena-agents-service'

// Types - Panels
export type {
  HelenaPanel,
  HelenaPanelsPaginatedResponse,
  HelenaPanelsListFilters,
  HelenaPanelCustomField,
  PanelStep
} from './helena-panels-service'

// Types - Contacts
export type {
  HelenaContactTagsPayload,
  HelenaBatchContact,
  HelenaCustomField
} from './helena-contacts-service'

// Types - Cards
export type {
  HelenaCardNote,
  HelenaCardsPaginatedResponse,
  HelenaNotesPaginatedResponse,
  HelenaCardsListFilters,
  HelenaCreateCardPayload,
  HelenaUpdateCardPayload,
  HelenaDuplicateCardPayload,
  HelenaCreateNotePayload,
  HelenaNotesListFilters
} from './helena-cards-service'

// Types - Metrics
// Note: HelenaMetricsService uses CrmMetrics from types/crm.ts

// Re-export common types from types/helena.ts
export type { HelenaContact, HelenaCard, HelenaStep, HelenaWallet } from '@/types/helena'

