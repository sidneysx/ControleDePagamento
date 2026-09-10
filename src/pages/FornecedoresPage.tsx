import { useEffect, useState, type FormEvent } from 'react'
import Modal from '../components/Modal'
import * as api from '../lib/api'
import type { Fornecedor, FornecedorPayload } from '../lib/api'
import { useMunicipios, useUFs } from '../lib/ibge'
import { formatCpfCnpj, onlyDigits } from '../lib/format'

const PAGE_SIZES = [10, 20, 50, 100]

const SORT_OPTIONS: { value: NonNullable<api.FornecedoresQuery['sort']>; label: string }[] = [
  { value: 'razao_social', label: 'Razão Social' },
  { value: 'cidade', label: 'Cidade' },
  { value: 'uf', label: 'Estado' },
  { value: 'created_at', label: 'Data de Cadastro' },
]

const EMPTY_FORM: FornecedorPayload = {
  cpf_cnpj: '',
  razao_social: '',
  favorecido: '',
  cidade: '',
  uf: '',
  banco: '',
  agencia: '',
  conta: '',
  tipo_conta: '',
  pix_favorecido: '',
  pix_cpf_cnpj: '',
  pix_tipo_chave: '',
  pix_chave: '',
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20l.9-3.6L16.4 5 19 7.6 7.6 19l-3.6.9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14.5 6.9L17 4.4a1.5 1.5 0 012.1 0l.5.5a1.5 1.5 0 010 2.1L17.1 9.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function fmt(value: string | null): string {
  return value && value.trim() ? value : '—'
}

function tipoContaLabel(tipo: string | null): string {
  if (tipo === 'corrente') return 'Corrente'
  if (tipo === 'poupanca') return 'Poupança'
  return '—'
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#13294b] outline-none focus:border-[#13294b] focus:ring-2 focus:ring-[#13294b]/20'
const labelClass = 'text-xs font-medium text-[#13294b]'

function TextField({
  id,
  label,
  value,
  onChange,
  span2,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  span2?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">{label}</dt>
      <dd className="text-sm text-[#13294b]">{value}</dd>
    </div>
  )
}

function ViewModal({ fornecedor, onClose }: { fornecedor: Fornecedor | null; onClose: () => void }) {
  return (
    <Modal open={!!fornecedor} onClose={onClose} title="Detalhes do Fornecedor" maxWidth="max-w-2xl">
      {fornecedor && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Dados Gerais</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="CPF/CNPJ" value={fmt(formatCpfCnpj(fornecedor.cpf_cnpj))} />
              <DetailRow label="Razão Social" value={fmt(fornecedor.razao_social)} />
              <DetailRow label="Nome do Favorecido" value={fmt(fornecedor.favorecido)} />
              <DetailRow label="Cidade" value={fmt(fornecedor.cidade)} />
              <DetailRow label="UF" value={fmt(fornecedor.uf)} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Dados Bancários</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Banco" value={fmt(fornecedor.banco)} />
              <DetailRow label="Agência" value={fmt(fornecedor.agencia)} />
              <DetailRow label="Conta" value={fmt(fornecedor.conta)} />
              <DetailRow label="Tipo da Conta" value={tipoContaLabel(fornecedor.tipo_conta)} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Dados PIX</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Favorecido PIX" value={fmt(fornecedor.pix_favorecido)} />
              <DetailRow label="CPF/CNPJ PIX" value={fmt(formatCpfCnpj(fornecedor.pix_cpf_cnpj))} />
              <DetailRow label="Tipo da Chave" value={fmt(fornecedor.pix_tipo_chave)} />
              <DetailRow label="Chave PIX" value={fmt(fornecedor.pix_chave)} />
            </dl>
          </section>
        </div>
      )}
    </Modal>
  )
}

type FormModalProps = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing: Fornecedor | null
}

function FormModal({ open, onClose, onSaved, editing }: FormModalProps) {
  const [form, setForm] = useState<FornecedorPayload>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { ufs } = useUFs()
  const { municipios, loading: municipiosLoading } = useMunicipios(form.uf)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setForm({
        cpf_cnpj: formatCpfCnpj(editing.cpf_cnpj),
        razao_social: editing.razao_social,
        favorecido: editing.favorecido,
        cidade: editing.cidade,
        uf: editing.uf,
        banco: editing.banco ?? '',
        agencia: editing.agencia ?? '',
        conta: editing.conta ?? '',
        tipo_conta: editing.tipo_conta ?? '',
        pix_favorecido: editing.pix_favorecido ?? '',
        pix_cpf_cnpj: formatCpfCnpj(editing.pix_cpf_cnpj),
        pix_tipo_chave: editing.pix_tipo_chave ?? '',
        pix_chave: editing.pix_chave ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editing])

  function set<K extends keyof FornecedorPayload>(key: K, value: FornecedorPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.cpf_cnpj.trim() || !form.razao_social.trim() || !form.favorecido.trim() || !form.cidade.trim() || !form.uf.trim()) {
      setError('CPF/CNPJ, Razão Social, Favorecido, Cidade e UF são obrigatórios.')
      return
    }

    const cpfCnpjDigits = onlyDigits(form.cpf_cnpj)
    if (cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14) {
      setError('CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) dígitos.')
      return
    }
    const pixCpfCnpjDigits = onlyDigits(form.pix_cpf_cnpj)
    if (pixCpfCnpjDigits && pixCpfCnpjDigits.length !== 11 && pixCpfCnpjDigits.length !== 14) {
      setError('CPF/CNPJ PIX deve ter 11 (CPF) ou 14 (CNPJ) dígitos.')
      return
    }

    const payload: FornecedorPayload = { ...form, cpf_cnpj: cpfCnpjDigits, pix_cpf_cnpj: pixCpfCnpjDigits }

    setSubmitting(true)
    try {
      if (editing) {
        await api.updateFornecedor(editing.id, payload)
      } else {
        await api.createFornecedor(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o fornecedor.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#13294b] hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="fornecedor-form"
            disabled={submitting}
            className="rounded-lg bg-[#13294b] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d1e38] disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="fornecedor-form" onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#13294b]">Dados do Fornecedor</h3>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="cpf_cnpj" label="CPF/CNPJ *" value={form.cpf_cnpj} onChange={(v) => set('cpf_cnpj', v)} />
            <TextField id="razao_social" label="Razão Social *" value={form.razao_social} onChange={(v) => set('razao_social', v)} />
            <TextField id="favorecido" label="Favorecido *" value={form.favorecido} onChange={(v) => set('favorecido', v)} span2 />
            <div className="flex flex-col gap-1">
              <label htmlFor="uf" className={labelClass}>
                UF *
              </label>
              <select
                id="uf"
                className={inputClass}
                value={form.uf}
                onChange={(e) => {
                  set('uf', e.target.value)
                  set('cidade', '')
                }}
              >
                <option value="">Selecione</option>
                {ufs.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.sigla} — {uf.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cidade" className={labelClass}>
                Cidade *
              </label>
              <select
                id="cidade"
                className={inputClass}
                value={form.cidade}
                onChange={(e) => set('cidade', e.target.value)}
                disabled={!form.uf}
              >
                <option value="">{!form.uf ? 'Selecione a UF primeiro' : municipiosLoading ? 'Carregando...' : 'Selecione'}</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.nome}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#13294b]">Dados Bancários (opcional)</h3>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="banco" label="Banco" value={form.banco} onChange={(v) => set('banco', v)} />
            <TextField id="agencia" label="Agência" value={form.agencia} onChange={(v) => set('agencia', v)} />
            <TextField id="conta" label="Conta" value={form.conta} onChange={(v) => set('conta', v)} />
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo_conta" className={labelClass}>
                Tipo da Conta
              </label>
              <select
                id="tipo_conta"
                className={inputClass}
                value={form.tipo_conta}
                onChange={(e) => set('tipo_conta', e.target.value as FornecedorPayload['tipo_conta'])}
              >
                <option value="">Selecione</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
              </select>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#13294b]">Dados PIX (opcional)</h3>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="pix_favorecido" label="Favorecido PIX" value={form.pix_favorecido} onChange={(v) => set('pix_favorecido', v)} />
            <TextField id="pix_cpf_cnpj" label="CPF/CNPJ PIX" value={form.pix_cpf_cnpj} onChange={(v) => set('pix_cpf_cnpj', v)} />
            <div className="flex flex-col gap-1">
              <label htmlFor="pix_tipo_chave" className={labelClass}>
                Tipo da Chave
              </label>
              <select
                id="pix_tipo_chave"
                className={inputClass}
                value={form.pix_tipo_chave}
                onChange={(e) => set('pix_tipo_chave', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="E-mail">E-mail</option>
                <option value="Celular">Celular</option>
                <option value="Chave Aleatória">Chave Aleatória</option>
              </select>
            </div>
            <TextField id="pix_chave" label="Chave PIX" value={form.pix_chave} onChange={(v) => set('pix_chave', v)} />
          </div>
        </section>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function DeleteModal({
  fornecedor,
  onClose,
  onConfirm,
  deleting,
}: {
  fornecedor: Fornecedor | null
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <Modal
      open={!!fornecedor}
      onClose={onClose}
      title="Excluir Fornecedor"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#13294b] hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Tem certeza que deseja excluir o fornecedor <strong className="text-[#13294b]">{fornecedor?.razao_social}</strong>? Essa
        ação não pode ser desfeita.
      </p>
    </Modal>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function FornecedoresPage() {
  const [data, setData] = useState<Fornecedor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [uf, setUf] = useState('')
  const [cidade, setCidade] = useState('')
  const [banco, setBanco] = useState('')
  const [sort, setSort] = useState<NonNullable<api.FornecedoresQuery['sort']>>('razao_social')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [viewing, setViewing] = useState<Fornecedor | null>(null)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Fornecedor | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { ufs } = useUFs()
  const { municipios: cidadeOptions, loading: cidadeOptionsLoading } = useMunicipios(uf)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  function reload() {
    setLoading(true)
    setLoadError(null)
    api
      .listFornecedores({ search, uf, cidade, banco, sort, order, page, pageSize })
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [search, uf, cidade, banco, sort, order, page, pageSize])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(f: Fornecedor) {
    setEditing(f)
    setFormOpen(true)
  }

  function handleSaved() {
    setFormOpen(false)
    setToast(editing ? 'Fornecedor atualizado com sucesso.' : 'Fornecedor cadastrado com sucesso.')
    reload()
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.deleteFornecedor(deleting.id)
      setDeleting(null)
      setToast('Fornecedor excluído com sucesso.')
      reload()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao excluir fornecedor.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const selectClass =
    'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#13294b] outline-none focus:border-[#13294b] focus:ring-2 focus:ring-[#13294b]/20'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#13294b]">Fornecedores</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#13294b] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d1e38]"
        >
          + Novo Fornecedor
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative min-w-60 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por CPF/CNPJ, razão social ou cidade"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-[#13294b] outline-none focus:border-[#13294b] focus:ring-2 focus:ring-[#13294b]/20"
          />
        </div>

        <select
          value={uf}
          onChange={(e) => {
            setUf(e.target.value)
            setCidade('')
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">UF (todas)</option>
          {ufs.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.sigla} — {u.nome}
            </option>
          ))}
        </select>

        <select
          value={cidade}
          onChange={(e) => {
            setCidade(e.target.value)
            setPage(1)
          }}
          disabled={!uf}
          className={`w-40 ${selectClass}`}
        >
          <option value="">{!uf ? 'Cidade (escolha a UF)' : cidadeOptionsLoading ? 'Carregando...' : 'Cidade (todas)'}</option>
          {cidadeOptions.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>

        <input
          value={banco}
          onChange={(e) => {
            setBanco(e.target.value)
            setPage(1)
          }}
          placeholder="Banco"
          className={`w-36 ${selectClass}`}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Ordenar: {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#13294b] hover:bg-gray-50"
          title={order === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
        >
          {order === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-190 text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">CPF/CNPJ</th>
              <th className="px-4 py-3 text-left">Razão Social</th>
              <th className="px-4 py-3 text-left">Cidade</th>
              <th className="px-4 py-3 text-left">UF</th>
              <th className="px-4 py-3 text-left">Dados Bancários</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows count={Math.min(pageSize, 8)} />
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-red-500">
                  {loadError}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhum fornecedor encontrado.
                </td>
              </tr>
            ) : (
              data.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#13294b]">{formatCpfCnpj(f.cpf_cnpj)}</td>
                  <td className="px-4 py-3 text-[#13294b]">{f.razao_social}</td>
                  <td className="px-4 py-3 text-[#13294b]">{f.cidade}</td>
                  <td className="px-4 py-3 text-[#13294b]">{f.uf}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setViewing(f)}
                      className="text-sm font-medium text-[#2f6fed] hover:underline"
                    >
                      Visualizar
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 text-gray-400">
                      <button
                        type="button"
                        onClick={() => setViewing(f)}
                        title="Visualizar"
                        className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-[#13294b]"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(f)}
                        title="Editar"
                        className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-[#13294b]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(f)}
                        title="Excluir"
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Registros por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className={selectClass}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>
            {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-[#13294b] hover:bg-gray-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-[#13294b] hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>

      <ViewModal fornecedor={viewing} onClose={() => setViewing(null)} />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} editing={editing} />
      <DeleteModal
        fornecedor={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleteBusy}
      />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[#13294b] px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
