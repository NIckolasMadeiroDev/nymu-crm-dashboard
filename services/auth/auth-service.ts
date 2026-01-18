import { AuthUser, type AuthSession } from '@/types/auth'

const AUTH_SESSION_KEY = 'nymu_auth_session'
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000

const CREDENTIALS: Record<AuthUser, string> = {
  [AuthUser.ADMIN]: '111632609904c531cecc538ae12661860d35e0810a33b9be0c16a06fa198fddb',
}

async function hashPassword(password: string): Promise<string> {
  if (globalThis.window === undefined) {
    return ''
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  try {
    if (!Object.values(AuthUser).includes(username as AuthUser)) {
      return false
    }

    const user = username as AuthUser
    const passwordHash = await hashPassword(password)
    const storedHash = CREDENTIALS[user]

    return timingSafeEqual(passwordHash, storedHash)
  } catch (error) {
    console.error('Erro ao validar credenciais:', error)
    return false
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    const codePointA = a.codePointAt(i) ?? 0
    const codePointB = b.codePointAt(i) ?? 0
    result |= codePointA ^ codePointB
  }
  return result === 0
}

export function createSession(username: AuthUser): void {
  if (globalThis.window === undefined) return

  const session: AuthSession = {
    username,
    loggedIn: true,
    timestamp: Date.now(),
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function isValidSession(): boolean {
  if (globalThis.window === undefined) return false

  try {
    const sessionStr = localStorage.getItem(AUTH_SESSION_KEY)
    if (!sessionStr) return false

    const session: AuthSession = JSON.parse(sessionStr)

    const now = Date.now()
    if (now - session.timestamp > SESSION_TIMEOUT) {
      clearSession()
      return false
    }

    if (!Object.values(AuthUser).includes(session.username)) {
      clearSession()
      return false
    }

    return session.loggedIn === true
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    clearSession()
    return false
  }
}

export function getSession(): AuthSession | null {
  if (globalThis.window === undefined) return null

  try {
    const sessionStr = localStorage.getItem(AUTH_SESSION_KEY)
    if (!sessionStr) return null

    const session: AuthSession = JSON.parse(sessionStr)

    if (!isValidSession()) {
      return null
    }

    return session
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }
}

export function clearSession(): void {
  if (globalThis.window === undefined) return
  localStorage.removeItem(AUTH_SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return isValidSession()
}

