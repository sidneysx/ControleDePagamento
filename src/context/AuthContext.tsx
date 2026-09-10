import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import * as api from '../lib/api'
import type { RegisterPayload, User } from '../lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string, remember: boolean) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string, remember: boolean) {
    const { user } = await api.login(username, password, remember)
    setUser(user)
  }

  async function register(payload: RegisterPayload) {
    const { user } = await api.register(payload)
    setUser(user)
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
