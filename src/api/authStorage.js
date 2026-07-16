export const AUTH_TOKEN_KEY = 'teamflow-auth-token'
export const AUTH_USER_KEY = 'teamflow-auth-user'
export const USER_ID_KEY = 'teamflow-user-id'
export const REMEMBER_KEY = 'teamflow-remember-me'

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
}

export function getAuthToken() {
  if (getRememberMe()) {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }
  return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY)
}

export function loadStoredUser() {
  const raw =
    localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAuth({ token, user, rememberMe }) {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)

  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(AUTH_TOKEN_KEY, token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  localStorage.setItem(USER_ID_KEY, String(user.id))
  localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false')
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

export function authHeaders(extra = {}) {
  const token = getAuthToken()
  const headers = { ...extra }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const userId = localStorage.getItem(USER_ID_KEY)
  if (userId) {
    headers['X-User-Id'] = userId
  }
  return headers
}
