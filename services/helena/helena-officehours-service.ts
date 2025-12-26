import { HelenaApiClient } from './helena-api-client'

export interface HelenaOfficeHourDayPeriod {
  startTime: string;
  endTime: string;
}

export interface HelenaOfficeHourDay {
  id: string;
  dayWeek: string;
  active: boolean;
  periods: HelenaOfficeHourDayPeriod[];
}

export interface HelenaOfficeHours {
  limitHours: boolean;
  offlineResponse: string;
  timezoneDiff: number;
  days: HelenaOfficeHourDay[];
}

export class HelenaOfficeHoursService {
  constructor(private readonly apiClient: HelenaApiClient) {}

  async getOfficeHours(): Promise<HelenaOfficeHours> {
    return this.apiClient.get<HelenaOfficeHours>('core/v1/company/officehours');
  }
}

