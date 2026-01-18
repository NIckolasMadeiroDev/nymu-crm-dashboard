export enum AuthUser {
  ADMIN = 'NymuDashboardAdmin',
}

export interface AuthCredentials {
  username: AuthUser
  password: string
}

export interface AuthSession {
  username: AuthUser
  loggedIn: boolean
  timestamp: number
}

