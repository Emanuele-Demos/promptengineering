import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginApi, register as registerApi, fetchCurrentUser, uploadAvatar as uploadAvatarApi, deleteAvatar as deleteAvatarApi } from '../api/auth.js'
import {
  clearAuth,
  getAuthToken,
  loadStoredUser,
  saveAuth,
} from '../api/authStorage.js'
import type { AuthUser } from '../api/auth.d.ts'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (input: {
    firstName: string
    role: string
    username?: string
    password: string
  }) => Promise<{ message: string; autoLoggedIn: boolean; onboardingTask?: { id: string; title: string } }>
  logout: () => void
  uploadAvatar: (file: File) => Promise<void>
  removeAvatar: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getAuthToken()
      const storedUser = loadStoredUser()

      if (!token || !storedUser) {
        if (!cancelled) {
          clearAuth()
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const { user: freshUser } = await fetchCurrentUser(token)
        if (!cancelled) {
          saveAuth({ token, user: freshUser, rememberMe: localStorage.getItem('teamflow-remember-me') === 'true' })
          setUser(freshUser)
        }
      } catch {
        if (!cancelled) {
          clearAuth()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const result = await loginApi({ email, password, rememberMe })
    saveAuth({ token: result.token, user: result.user, rememberMe })
    setUser(result.user)
  }, [])

  const register = useCallback(
    async (input: {
      firstName: string
      role: string
      username?: string
      password: string
    }) => {
      const result = await registerApi(input)

      if (result.token && result.user) {
        saveAuth({ token: result.token, user: result.user, rememberMe: false })
        setUser(result.user)
        return {
          message: result.message,
          autoLoggedIn: true,
          onboardingTask: result.onboardingTask,
        }
      }

      return {
        message: result.message,
        autoLoggedIn: false,
        onboardingTask: result.onboardingTask,
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Sessione scaduta')
    }

    const { user: updatedUser } = await uploadAvatarApi({ token, file })
    const rememberMe = localStorage.getItem('teamflow-remember-me') === 'true'
    saveAuth({ token, user: updatedUser, rememberMe })
    setUser(updatedUser)
  }, [])

  const removeAvatar = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Sessione scaduta')
    }

    const { user: updatedUser } = await deleteAvatarApi(token)
    const rememberMe = localStorage.getItem('teamflow-remember-me') === 'true'
    saveAuth({ token, user: updatedUser, rememberMe })
    setUser(updatedUser)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAuthToken()),
      loading,
      login,
      register,
      logout,
      uploadAvatar,
      removeAvatar,
    }),
    [user, loading, login, register, logout, uploadAvatar, removeAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
