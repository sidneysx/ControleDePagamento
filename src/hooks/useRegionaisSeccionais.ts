import { useEffect, useState } from 'react'
import * as api from '../lib/api'

export function useRegionais() {
  const [regionais, setRegionais] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    api
      .listRegionais()
      .then((res) => setRegionais(res.data.map((r) => r.nome)))
      .catch(() => setRegionais([]))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  return { regionais, loading, reload }
}

export function useSeccionais(regional: string) {
  const [seccionais, setSeccionais] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function reload() {
    if (!regional) {
      setSeccionais([])
      return
    }
    setLoading(true)
    api
      .listSeccionais(regional)
      .then((res) => setSeccionais(res.data.map((s) => s.nome)))
      .catch(() => setSeccionais([]))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [regional])

  return { seccionais, loading, reload }
}
