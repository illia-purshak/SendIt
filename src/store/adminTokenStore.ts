const ADMIN_REFRESH_KEY = 'sendit.admin.refreshToken'
const ADMIN_PENDING_KEY = 'sendit.admin.pendingToken'
const ADMIN_SETUP_KEY = 'sendit.admin.setupToken'
const ADMIN_IS_SUPER_KEY = 'sendit.admin.isSuperAdmin'
const ADMIN_SESSION_KEY = 'sendit.admin.session'

let _adminAccessToken: string | null = null

export interface AdminSession {
  email: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  isSuperAdmin: boolean
}

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!base64) return {}
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function readStoredSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AdminSession
  } catch {
    return null
  }
}

function writeStoredSession(session: AdminSession | null): void {
  if (typeof window === 'undefined') return

  if (!session) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    return
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

function sessionFromToken(token: string): Partial<AdminSession> {
  const payload = parseJwtPayload(token)
  const role = typeof payload.role === 'string' ? payload.role : null
  const isSuperAdmin =
    payload.isSuperAdmin === true || role === 'SUPER_ADMIN'

  return {
    email:
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.sub === 'string' && payload.sub.includes('@')
          ? payload.sub
          : null,
    firstName:
      typeof payload.firstName === 'string' ? payload.firstName : null,
    lastName:
      typeof payload.lastName === 'string' ? payload.lastName : null,
    avatarUrl:
      typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null,
    isSuperAdmin,
  }
}

export const adminTokenStore = {
  getToken: (): string | null => _adminAccessToken,
  hasSession: (): boolean => {
    if (_adminAccessToken) return true
    if (typeof window === 'undefined') return false
    return Boolean(window.localStorage.getItem(ADMIN_REFRESH_KEY))
  },
  setTokens: (access: string, refresh: string): void => {
    _adminAccessToken = access
    const currentSession = readStoredSession()
    const tokenSession = sessionFromToken(access)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_REFRESH_KEY, refresh)
      window.localStorage.setItem(
        ADMIN_IS_SUPER_KEY,
        (tokenSession.isSuperAdmin ?? currentSession?.isSuperAdmin ?? false) ? 'true' : 'false',
      )
    }

    writeStoredSession({
      email: tokenSession.email ?? currentSession?.email ?? null,
      firstName: tokenSession.firstName ?? currentSession?.firstName ?? null,
      lastName: tokenSession.lastName ?? currentSession?.lastName ?? null,
      avatarUrl: tokenSession.avatarUrl ?? currentSession?.avatarUrl ?? null,
      isSuperAdmin: tokenSession.isSuperAdmin ?? currentSession?.isSuperAdmin ?? false,
    })
  },
  getIsSuperAdmin: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(ADMIN_IS_SUPER_KEY) === 'true'
  },
  setIsSuperAdmin: (value: boolean): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_IS_SUPER_KEY, value ? 'true' : 'false')
    }

    const currentSession = readStoredSession()
    writeStoredSession({
      email: currentSession?.email ?? null,
      firstName: currentSession?.firstName ?? null,
      lastName: currentSession?.lastName ?? null,
      avatarUrl: currentSession?.avatarUrl ?? null,
      isSuperAdmin: value,
    })
  },
  setSession: (session: Partial<AdminSession>): void => {
    const currentSession = readStoredSession()
    writeStoredSession({
      email: session.email ?? currentSession?.email ?? null,
      firstName: session.firstName ?? currentSession?.firstName ?? null,
      lastName: session.lastName ?? currentSession?.lastName ?? null,
      avatarUrl: session.avatarUrl ?? currentSession?.avatarUrl ?? null,
      isSuperAdmin: session.isSuperAdmin ?? currentSession?.isSuperAdmin ?? false,
    })
  },
  getSession: (): AdminSession | null => readStoredSession(),
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ADMIN_REFRESH_KEY)
  },
  getPendingToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem(ADMIN_PENDING_KEY)
  },
  setPendingToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_PENDING_KEY, token)
    }
  },
  clearPendingToken: (): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_PENDING_KEY)
    }
  },
  getSetupToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem(ADMIN_SETUP_KEY)
  },
  setSetupToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_SETUP_KEY, token)
    }
  },
  clearSetupToken: (): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_SETUP_KEY)
    }
  },
  clear: (): void => {
    _adminAccessToken = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_REFRESH_KEY)
      window.localStorage.removeItem(ADMIN_IS_SUPER_KEY)
      window.localStorage.removeItem(ADMIN_SESSION_KEY)
      window.sessionStorage.removeItem(ADMIN_PENDING_KEY)
      window.sessionStorage.removeItem(ADMIN_SETUP_KEY)
    }
  },
}
