import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getAuthToken, setAuthToken, setUnauthorizedHandler } from '../api/client'

type AuthContextValue = {
  isAdmin: boolean
  username: string | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    setAuthToken(null)
    setUsername(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUsername(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      const token = getAuthToken()
      if (!token) {
        if (!cancelled) setReady(true)
        return
      }
      try {
        const me = await api.me()
        if (!cancelled) setUsername(me.username)
      } catch {
        setAuthToken(null)
        if (!cancelled) setUsername(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (user: string, password: string) => {
    const result = await api.login(user, password)
    setAuthToken(result.access_token)
    setUsername(result.username)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAdmin: Boolean(username),
      username,
      ready,
      login,
      logout,
    }),
    [username, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
