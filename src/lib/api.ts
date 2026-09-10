export type User = {
  id: number
  username: string
  email: string
  regional: string
  seccional: string
  role: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  regional: string
  seccional: string
}

class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error ?? `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export function login(username: string, password: string, remember: boolean) {
  return request<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  })
}

export function register(payload: RegisterPayload) {
  return request<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' })
}

export function me() {
  return request<{ user: User }>('/auth/me')
}

export type Fornecedor = {
  id: number
  cpf_cnpj: string
  razao_social: string
  favorecido: string
  cidade: string
  uf: string
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: 'corrente' | 'poupanca' | null
  pix_favorecido: string | null
  pix_cpf_cnpj: string | null
  pix_tipo_chave: string | null
  pix_chave: string | null
  created_at: string
}

export type FornecedorPayload = {
  cpf_cnpj: string
  razao_social: string
  favorecido: string
  cidade: string
  uf: string
  banco: string
  agencia: string
  conta: string
  tipo_conta: 'corrente' | 'poupanca' | ''
  pix_favorecido: string
  pix_cpf_cnpj: string
  pix_tipo_chave: string
  pix_chave: string
}

export type FornecedoresQuery = {
  search?: string
  uf?: string
  cidade?: string
  banco?: string
  sort?: 'razao_social' | 'cidade' | 'uf' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type FornecedoresResponse = {
  data: Fornecedor[]
  total: number
  page: number
  pageSize: number
}

export function listFornecedores(query: FornecedoresQuery) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.uf) params.set('uf', query.uf)
  if (query.cidade) params.set('cidade', query.cidade)
  if (query.banco) params.set('banco', query.banco)
  if (query.sort) params.set('sort', query.sort)
  if (query.order) params.set('order', query.order)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const qs = params.toString()
  return request<FornecedoresResponse>(`/fornecedores${qs ? `?${qs}` : ''}`)
}

export function createFornecedor(payload: FornecedorPayload) {
  return request<{ fornecedor: Fornecedor }>('/fornecedores', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFornecedor(id: number, payload: FornecedorPayload) {
  return request<{ fornecedor: Fornecedor }>(`/fornecedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteFornecedor(id: number) {
  return request<void>(`/fornecedores/${id}`, { method: 'DELETE' })
}

export type NotaPayload = {
  numero: string
  operacao: string
  regional: string
  seccional: string
  cidade: string
  uf: string
  fornecedor_id: number | null
  numero_nota: string
  valor: string
  data_emissao: string
  placa: string
  descricao: string
  contrato: string
  centro_custo: string
  categoria: string
  observacao: string
}

export function createNota(payload: NotaPayload) {
  return request<{ nota: unknown }>('/notas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type Regional = { id: number; nome: string }
export type Seccional = { id: number; nome: string }

export function listRegionais() {
  return request<{ data: Regional[] }>('/regionais')
}

export function createRegional(nome: string) {
  return request<{ regional: Regional }>('/regionais', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  })
}

export function listSeccionais(regional: string) {
  return request<{ data: Seccional[] }>(`/seccionais?regional=${encodeURIComponent(regional)}`)
}

export function createSeccional(nome: string, regional: string) {
  return request<{ seccional: Seccional }>('/seccionais', {
    method: 'POST',
    body: JSON.stringify({ nome, regional }),
  })
}
