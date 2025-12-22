const DATA_SOURCE_KEY = 'dashboard_data_source'
const COOKIE_NAME = 'dashboard_data_source'

export type DataSource = 'real' | 'mock'

class DataSourcePreferenceService {
  getDataSource(): DataSource {
    if (typeof window === 'undefined') {
      return 'mock'
    }

    const cookieValue = this.getCookie(COOKIE_NAME)
    if (cookieValue === 'mock' || cookieValue === 'real') {
      return cookieValue
    }

    const stored = localStorage.getItem(DATA_SOURCE_KEY)
    if (stored === 'mock' || stored === 'real') {
      this.setCookie(COOKIE_NAME, stored, 365)
      return stored
    }

    const defaultValue = 'mock'
    this.setCookie(COOKIE_NAME, defaultValue, 365)
    return defaultValue
  }

  setDataSource(source: DataSource): void {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(DATA_SOURCE_KEY, source)
    this.setCookie(COOKIE_NAME, source, 365)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataSourcePreference] Data source set to:', source)
    }
  }

  isUsingMockData(): boolean {
    return this.getDataSource() === 'mock'
  }

  isUsingRealData(): boolean {
    return this.getDataSource() === 'real'
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null
    }
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  private setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') {
      return
    }
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  getDataSourceFromRequest(cookieHeader: string | null): DataSource {
    if (!cookieHeader) {
      return 'mock'
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const dataSource = cookies[COOKIE_NAME]
    if (dataSource === 'mock' || dataSource === 'real') {
      return dataSource
    }

    return 'mock'
  }
}

export const dataSourcePreferenceService = new DataSourcePreferenceService()

