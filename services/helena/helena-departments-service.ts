import { HelenaApiClient } from './helena-api-client'

export interface HelenaDepartmentAgent {
  userId: string
  departmentId: string
  isAgent: boolean
  isSupervisor: boolean
}

export interface HelenaDepartmentChannel {
  id: string
  number: string | null
  name: string | null
  type: string
}

export interface HelenaDepartmentDistributionConfig {
  expirationIsEnabled: boolean
  maximumDurationInMinutes: number
  inactivityTimeInMinutes: number
}

export interface HelenaDepartmentChannelsConfig {
  // Define based on API response structure
  [key: string]: any
}

export interface HelenaDepartment {
  id: string
  companyId: string
  createdAt: string
  updatedAt: string
  name: string
  isDefault: boolean
  distribuitionEnabled: boolean
  distributionConfig?: HelenaDepartmentDistributionConfig
  restrictionType: 'NONE' | 'DEPARTMENT_RESTRICTION' | 'USER_RESTRICTION' | null
  channelsConfig?: HelenaDepartmentChannelsConfig
  agents?: HelenaDepartmentAgent[]
  channels?: HelenaDepartmentChannel[]
  description?: string
  isPrivate?: boolean
  directLinks?: any
}

export interface CreateDepartmentPayload {
  name: string | null
  isDefault: boolean
  distributionIsEnabled: boolean
  distributionConfig?: HelenaDepartmentDistributionConfig
  restrictionType?: 'NONE' | 'DEPARTMENT_RESTRICTION' | 'USER_RESTRICTION' | null
  channelsConfig?: HelenaDepartmentChannelsConfig
  agents?: Array<{
    userId: string
    isAgent?: boolean
    isSupervisor?: boolean
  }>
}

export interface UpdateDepartmentPayload {
  name?: string | null
  isDefault?: boolean
  distributionIsEnabled?: boolean
  distributionConfig?: HelenaDepartmentDistributionConfig
  restrictionType?: 'NONE' | 'DEPARTMENT_RESTRICTION' | 'USER_RESTRICTION' | null
  channelsConfig?: HelenaDepartmentChannelsConfig
  fields: string[] // Campos que devem ser atualizados
}

export interface UpdateDepartmentAgentsPayload {
  action: 'ReplaceAll' | 'Upsert' | 'Remove'
  items: Array<{
    userId: string
    isAgent?: boolean
    isSupervisor?: boolean
  }>
}

export class HelenaDepartmentsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  /**
   * Cria uma nova equipe
   */
  async createDepartment(payload: CreateDepartmentPayload): Promise<HelenaDepartment> {
    try {
      const response = await this.apiClient.post<HelenaDepartment>('core/v1/department', payload)
      return response
    } catch (error) {
      console.error('Error creating department from Helena API:', error)
      throw error
    }
  }

  /**
   * Lista todas as equipes
   */
  async listDepartments(): Promise<HelenaDepartment[]> {
    try {
      const response = await this.apiClient.get<HelenaDepartment[]>('core/v2/department')
      // A API v2 retorna um array diretamente
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('Error fetching departments from Helena API:', error)
      throw error
    }
  }

  /**
   * Obtém uma equipe por ID
   * @param id ID da equipe
   * @param includeDetails Opcional: 'All', 'Agents', 'Channels' para incluir detalhes
   */
  async getDepartmentById(
    id: string,
    includeDetails?: 'All' | 'Agents' | 'Channels'
  ): Promise<HelenaDepartment> {
    try {
      const params: Record<string, string> = {}
      if (includeDetails) {
        params.includeDetails = includeDetails
      }
      const response = await this.apiClient.get<HelenaDepartment>(
        `core/v1/department/${id}`,
        params
      )
      return response
    } catch (error) {
      console.error(`Error fetching department ${id} from Helena API:`, error)
      throw error
    }
  }

  /**
   * Atualiza uma equipe
   */
  async updateDepartment(
    id: string,
    payload: UpdateDepartmentPayload
  ): Promise<HelenaDepartment> {
    try {
      const response = await this.apiClient.put<HelenaDepartment>(
        `core/v1/department/${id}`,
        payload
      )
      return response
    } catch (error) {
      console.error(`Error updating department ${id} from Helena API:`, error)
      throw error
    }
  }

  /**
   * Exclui uma equipe
   */
  async deleteDepartment(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`core/v1/department/${id}`)
    } catch (error) {
      console.error(`Error deleting department ${id} from Helena API:`, error)
      throw error
    }
  }

  /**
   * Atualiza os usuários de uma equipe
   * @param id ID da equipe
   * @param payload Payload com action ('ReplaceAll', 'Upsert', 'Remove') e items
   */
  async updateDepartmentAgents(
    id: string,
    payload: UpdateDepartmentAgentsPayload
  ): Promise<HelenaDepartmentAgent[]> {
    try {
      const response = await this.apiClient.put<HelenaDepartmentAgent[]>(
        `core/v1/department/${id}/agents`,
        payload
      )
      return response
    } catch (error) {
      console.error(`Error updating department agents for ${id} from Helena API:`, error)
      throw error
    }
  }

  /**
   * Lista os canais de uma equipe
   */
  async listDepartmentChannels(id: string): Promise<HelenaDepartmentChannel[]> {
    try {
      const response = await this.apiClient.get<HelenaDepartmentChannel[]>(
        `core/v1/department/${id}/channel`
      )
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error(`Error fetching department channels for ${id} from Helena API:`, error)
      throw error
    }
  }

  /**
   * Obtém todas as equipes com detalhes (agents e channels)
   */
  async getAllDepartmentsWithDetails(): Promise<HelenaDepartment[]> {
    try {
      const departments = await this.listDepartments()
      
      // Buscar detalhes para cada equipe
      const departmentsWithDetails = await Promise.all(
        departments.map(async (dept) => {
          try {
            const details = await this.getDepartmentById(dept.id, 'All')
            return details
          } catch (error) {
            console.warn(`Could not fetch details for department ${dept.id}:`, error)
            return dept
          }
        })
      )
      
      return departmentsWithDetails
    } catch (error) {
      console.error('Error fetching all departments with details:', error)
      throw error
    }
  }
}
