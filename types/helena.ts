export interface HelenaApiConfig {
  baseUrl: string
  token: string
  timeout?: number
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
  value?: number
  stepId?: string
  panelId: string
  contactId?: string
  ownerId?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  status?: string
  customFields?: Record<string, unknown>
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

