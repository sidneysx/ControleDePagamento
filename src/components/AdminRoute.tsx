import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user?.role !== 'adm') {
    return <Navigate to="/" replace />
  }

  return children
}
