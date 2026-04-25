const AUTH_TOKEN_STORAGE_KEY = 'sendit.accessToken'

function readInitialToken(): string | null {
  if (typeof window === 'undefined') return null

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  return token && token.trim() ? token : null
}

let accessToken: string | null = readInitialToken()

export const authStore = {
  getToken: (): string | null => accessToken,
  setToken: (token: string): void => {
    accessToken = token
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    }
  },
  clear: (): void => {
    accessToken = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }
  },
}
