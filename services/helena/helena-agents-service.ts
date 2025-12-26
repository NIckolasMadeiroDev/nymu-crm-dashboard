import { HelenaApiClient } from './helena-api-client'

export interface HelenaAgentDepartment {
  agentId: string;
  departmentId: string;
  isAgent: boolean;
  isSupervisor: boolean;
}

export interface HelenaAgent {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  userId: string;
  name: string;
  shortName: string | null;
  email: string;
  phoneNumber: string;
  phoneNumberFormatted: string;
  profile: 'AGENT' | 'ADMIN' | 'SUPER_ADMIN' | 'RESTRICTED_AGENT';
  isOwner: boolean;
  departments: HelenaAgentDepartment[];
}

export class HelenaAgentsService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async listAgents(): Promise<HelenaAgent[]> {
    return this.apiClient.get<HelenaAgent[]>('core/v1/agent');
  }
}

