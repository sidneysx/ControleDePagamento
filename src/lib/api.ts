export type User = {
  id: number
  username: string
  email: string
  regional: string
  seccional: string
  setor: string | null
  role: string
  status: string
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

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error ?? `Request failed (${res.status})`)
  }

  return res.json() as Promise<T>
}

export function login(username: string, password: string, remember: boolean) {
  return request<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  })
}

export function register(payload: RegisterPayload) {
  return request<{ message: string }>('/auth/register', {
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
  tipo_pagamento: string
  pagamento_favorecido: string
  pagamento_cpf_cnpj: string
  pagamento_banco: string
  pagamento_agencia: string
  pagamento_conta: string
  pagamento_pix_tipo_chave: string
  pagamento_pix_chave: string
  data_programacao: string
}

export type NotaFiles = {
  boleto?: File | null
  notaFiscal?: File | null
}

export type Nota = {
  id: number
  numero: string
  operacao: string
  regional: string
  seccional: string
  cidade: string
  uf: string
  fornecedor_id: number | null
  fornecedor_razao_social: string | null
  fornecedor_cpf_cnpj: string | null
  numero_nota: string
  valor: string
  data_emissao: string
  placa: string | null
  descricao: string | null
  contrato: string
  centro_custo: string
  categoria: string
  observacao: string | null
  tipo_pagamento: string
  pagamento_favorecido: string
  pagamento_cpf_cnpj: string
  pagamento_banco: string | null
  pagamento_agencia: string | null
  pagamento_conta: string | null
  pagamento_pix_tipo_chave: string | null
  pagamento_pix_chave: string | null
  boleto_arquivo: string | null
  boleto_arquivo_nome: string | null
  data_programacao: string
  nota_fiscal_arquivo: string | null
  nota_fiscal_arquivo_nome: string | null
  created_by: number
  created_by_username: string | null
  created_at: string
}

export function createNota(payload: NotaPayload, files: NotaFiles = {}) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && value !== undefined) formData.append(key, String(value))
  }
  if (files.boleto) formData.append('boleto_arquivo', files.boleto)
  if (files.notaFiscal) formData.append('nota_fiscal_arquivo', files.notaFiscal)

  return requestForm<{ nota: Nota }>('/notas', formData)
}

export type NotasQuery = {
  search?: string
  dataProgramacao?: string
  regional?: string
  seccional?: string
}

export function listNotas(query: NotasQuery = {}) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.dataProgramacao) params.set('data_programacao', query.dataProgramacao)
  if (query.regional) params.set('regional', query.regional)
  if (query.seccional) params.set('seccional', query.seccional)
  const qs = params.toString()
  return request<{ data: Nota[] }>(`/notas${qs ? `?${qs}` : ''}`)
}

export type Programacao = {
  data_programacao: string
  total_notas: string
  valor_total: string
}

export function listProgramacoes() {
  return request<{ data: Programacao[] }>('/notas/programacoes')
}

export function deleteNota(id: number) {
  return request<void>(`/notas/${id}`, { method: 'DELETE' })
}

export function updateNotaDataProgramacao(id: number, dataProgramacao: string) {
  return request<{ nota: Nota }>(`/notas/${id}/data-programacao`, {
    method: 'PUT',
    body: JSON.stringify({ data_programacao: dataProgramacao }),
  })
}

export function notaArquivoUrl(id: number, campo: 'boleto' | 'nota_fiscal') {
  return `/api/notas/${id}/arquivo/${campo}`
}

export type UserPayload = {
  username: string
  email: string
  password: string
  regional: string
  seccional: string
  setor: string
  role: string
}

export function listUsers() {
  return request<{ data: User[] }>('/users')
}

export function createUser(payload: UserPayload) {
  return request<{ user: User }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: number, payload: Omit<UserPayload, 'password'>) {
  return request<{ user: User }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateUserPassword(id: number, password: string) {
  return request<void>(`/users/${id}/senha`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  })
}

export function deleteUser(id: number) {
  return request<void>(`/users/${id}`, { method: 'DELETE' })
}

export function approveUser(id: number) {
  return request<{ user: User }>(`/users/${id}/aprovar`, { method: 'PUT' })
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

export type CentroCusto = { centro_custo: string; categorias: string[] }

export function listCentrosCusto() {
  return request<{ data: CentroCusto[] }>('/centros-custo')
}
