import { useEffect, useState } from 'react'

export type UF = { sigla: string; nome: string }
export type Municipio = { id: number; nome: string }

const ufCache: { data: UF[] | null; promise: Promise<UF[]> | null } = { data: null, promise: null }
const municipioCache = new Map<string, Municipio[]>()

export function fetchUFs(): Promise<UF[]> {
  if (ufCache.data) return Promise.resolve(ufCache.data)
  if (!ufCache.promise) {
    ufCache.promise = fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar estados (IBGE).')
        return res.json() as Promise<Array<{ sigla: string; nome: string }>>
      })
      .then((rows) => {
        const ufs = rows.map((r) => ({ sigla: r.sigla, nome: r.nome }))
        ufCache.data = ufs
        return ufs
      })
      .catch((err) => {
        ufCache.promise = null
        throw err
      })
  }
  return ufCache.promise
}

export function fetchMunicipios(uf: string): Promise<Municipio[]> {
  const cached = municipioCache.get(uf)
  if (cached) return Promise.resolve(cached)

  return fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
    .then((res) => {
      if (!res.ok) throw new Error('Falha ao carregar cidades (IBGE).')
      return res.json() as Promise<Array<{ id: number; nome: string }>>
    })
    .then((rows) => {
      const municipios = rows
        .map((r) => ({ id: r.id, nome: r.nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      municipioCache.set(uf, municipios)
      return municipios
    })
}

export function useUFs() {
  const [ufs, setUfs] = useState<UF[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchUFs()
      .then((data) => {
        if (active) setUfs(data)
      })
      .catch(() => {
        if (active) setUfs([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { ufs, loading }
}

export function useMunicipios(uf: string) {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uf) {
      setMunicipios([])
      return
    }
    let active = true
    setLoading(true)
    fetchMunicipios(uf)
      .then((data) => {
        if (active) setMunicipios(data)
      })
      .catch(() => {
        if (active) setMunicipios([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [uf])

  return { municipios, loading }
}
