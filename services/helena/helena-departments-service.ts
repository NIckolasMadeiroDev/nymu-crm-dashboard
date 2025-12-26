import { HelenaApiClient } from './helena-api-client'

export interface HelenaDepartmentAgent {
  userId: string;
  departmentId: string;
  isAgent: boolean;
  isSupervisor: boolean;
}

export interface HelenaDepartment {
  id: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  isDefault: boolean;
  distribuitionEnabled: boolean;
  distributionConfig?: {
    expirationIsEnabled: boolean;
    maximumDurationInMinutes: number;
    inactivityTimeInMinutes: number;
  };
  restrictionType: 'NONE' | 'DEPARTMENT_RESTRICTION' | 'USER_RESTRICTION' | null;
  channelsConfig?: object;
  agents?: HelenaDepartmentAgent[];
  channels?: any[];
  description?: string;
  isPrivate?: boolean;
}

export class HelenaDepartmentsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async createDepartment(payload: Partial<HelenaDepartment>): Promise<HelenaDepartment> {
    return this.apiClient.post<HelenaDepartment>('core/v1/department', payload)
  }

  async listDepartments(): Promise<HelenaDepartment[]> {
    return this.apiClient.get<HelenaDepartment[]>('core/v2/department')
  }

  async getDepartmentById(id: string): Promise<HelenaDepartment> {
    return this.apiClient.get<HelenaDepartment>(`core/v1/department/${id}`)
  }

  async updateDepartment(id: string, payload: Partial<HelenaDepartment>): Promise<HelenaDepartment> {
    return this.apiClient.put<HelenaDepartment>(`core/v1/department/${id}`, payload)
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.apiClient.delete(`core/v1/department/${id}`)
  }

  async updateDepartmentAgents(id: string, body: { action: 'ReplaceAll'|'Upsert'|'Remove', items: Array<any> }): Promise<any> {
    return this.apiClient.put<any>(`core/v1/department/${id}/agents`, body)
  }

  async listDepartmentChannels(id: string): Promise<any[]> {
    return this.apiClient.get<any[]>(`core/v1/department/${id}/channel`)
  }
}
