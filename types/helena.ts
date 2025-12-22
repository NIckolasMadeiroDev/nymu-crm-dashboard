export interface HelenaApiConfig {
  baseUrl: string
  token: string
  timeout?: number
}

export class HelenaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'HelenaApiError'
  }
}

export interface HelenaApiResponse<T> {
  data?: T
  error?: HelenaApiError
  success: boolean
}

export interface HelenaContact {
  id: string
  name: string
  email?: string
  phone?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, unknown>
}

export interface HelenaCard {
  id: string
  title: string
  description?: string
  value?: number
  monetaryAmount?: number
  stepId?: string
  panelId?: string
  panelTitle?: string
  stepTitle?: string
  stepPhase?: string
  position?: number
  contactId?: string
  contactIds?: string[]
  contacts?: Array<{ id: string; name: string }>
  ownerId?: string
  responsibleUserId?: string
  responsibleUser?: { id: string; name: string }
  createdAt: string
  updatedAt: string
  closedAt?: string
  dueDate?: string
  isOverdue?: boolean
  status?: string
  archived?: boolean
  customFields?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface HelenaPanel {
  id: string
  name: string
  steps?: HelenaStep[]
  createdAt?: string
  updatedAt?: string
}

export interface HelenaStep {
  id: string
  name: string
  panelId: string
  order?: number
  cards?: HelenaCard[]
}

export interface HelenaWallet {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  active?: boolean
  companyId?: string
  automaticAttribution?: boolean
  expirationDurationInMonths?: number
  contactsCount?: number
  type?: 'MULTIPLE' | 'SINGLE'
  departments?: Array<{
    departmentId: string
    userIds: string[]
  }>
}

export interface HelenaAccount {
  id: string
  name: string
  email?: string
  phone?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface HelenaChannel {
  id: string
  name: string
  type?: string
  createdAt?: string
  updatedAt?: string
}

export interface HelenaTeam {
  id: string
  name: string
  description?: string
  users?: HelenaUser[]
  channels?: HelenaChannel[]
  createdAt?: string
  updatedAt?: string
}

export interface HelenaUser {
  id: string
  name: string
  email: string
  phone?: string
  status?: string
  teams?: HelenaTeam[]
  createdAt?: string
  updatedAt?: string
}

export interface HelenaTag {
  id: string
  name: string
  color?: string
  createdAt?: string
  updatedAt?: string
}

export interface HelenaBusinessHours {
  id?: string
  timezone?: string
  schedules?: Array<{
    day: number
    start: string
    end: string
  }>
}

export interface HelenaPartner {
  id: string
  name: string
  billingReport?: {
    period: string
    amount: number
  }
}

export interface HelenaField {
  id: string
  name: string
  type: string
  required?: boolean
  options?: string[]
}

export interface HelenaFile {
  id: string
  name: string
  url: string
  type?: string
  size?: number
  createdAt?: string
}

export interface HelenaLead {
  id: string
  name: string
  email?: string
  phone?: string
  source?: string
  status?: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, unknown>
}

export interface HelenaApiPagination {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export interface HelenaApiListResponse<T> {
  data: T[]
  pagination?: HelenaApiPagination
}

export interface HelenaPaginatedResponse<T> {
  pageNumber: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'ASCENDING' | 'DESCENDING'
  items: T[]
  totalItems: number
  totalPages: number
  hasMorePages: boolean
}

