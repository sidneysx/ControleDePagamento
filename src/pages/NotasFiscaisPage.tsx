import { useEffect, useRef, useState, type FormEvent } from 'react'
import Modal from '../components/Modal'
import PagePlaceholder from '../components/PagePlaceholder'
import * as api from '../lib/api'
import type { Fornecedor, NotaPayload } from '../lib/api'
import { useMunicipios, useUFs } from '../lib/ibge'
import { formatCpfCnpj } from '../lib/format'

function alphaSort(list: string[]): string[] {
  return [...list].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function formatCodeLabel(raw: string): string {
  return raw
    .split('_')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ')
}

function toOptions(codes: string[]): { value: string; label: string }[] {
  return codes
    .map((value) => ({ value, label: formatCodeLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

const OPERACOES = alphaSort(['Administrativo', 'Comercial', 'Logística', 'Perdas', 'PLPT', 'Técnica'])
const CONTRATOS = alphaSort(['Âncora', 'DPL', 'LV AT', 'PLPT', 'Transmissão', 'Transporte'])
const CENTROS_CUSTO = toOptions([
  'ALIMENTAÇÃO_HOSPEDAGEM',
  'ALMOXARIFADO',
  'DESP_ADMINISTRATIVA',
  'DESP_FIXA',
  'DP_PESSOAL',
  'FROTA',
  'MANUTENÇÃO_PREDIAL',
  'OBRA_OPERACIONAL',
  'OBRA_TRANSMISSAO',
  'TAXAS_E_TRIBUTOS',
  'TI',
])
const CATEGORIAS = toOptions(['ALIMENTAÇÃO', 'HOSPEDAGEM', 'ALIMENTAÇÃO_HOSPEDAGEM'])

const EMPTY_FORM: NotaPayload = {
  numero: '',
  operacao: '',
  regional: '',
  seccional: '',
  uf: '',
  cidade: '',
  fornecedor_id: null,
  numero_nota: '',
  valor: '',
  data_emissao: '',
  placa: '',
  descricao: '',
  contrato: '',
  centro_custo: '',
  categoria: '',
  observacao: '',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#13294b] outline-none focus:border-[#13294b] focus:ring-2 focus:ring-[#13294b]/20'
const labelClass = 'text-xs font-medium text-[#13294b]'

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  span2,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  span2?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} type={type} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label} *
      </label>
      <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const NEW_OPTION = '__new__'

function CreatableSelect({
  id,
  label,
  value,
  onChange,
  options,
  loading,
  onCreate,
  disabled,
  disabledPlaceholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  loading: boolean
  onCreate: (nome: string) => Promise<void>
  disabled?: boolean
  disabledPlaceholder?: string
}) {
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate() {
    const nome = newValue.trim()
    if (!nome) return
    setCreating(true)
    setCreateError(null)
    try {
      await onCreate(nome)
      onChange(nome)
      setAdding(false)
      setNewValue('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Não foi possível adicionar.')
    } finally {
      setCreating(false)
    }
  }

  if (adding) {
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{label} *</label>
        <div className="flex gap-2">
          <input
            autoFocus
            className={inputClass}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`Nova ${label.toLowerCase()}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newValue.trim()}
            className="shrink-0 rounded-lg bg-[#13294b] px-3 py-2 text-xs font-medium text-white hover:bg-[#0d1e38] disabled:opacity-50"
          >
            {creating ? '...' : 'Adicionar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setNewValue('')
              setCreateError(null)
            }}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-[#13294b] hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
        {createError && <p className="text-xs text-red-500">{createError}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label} *
      </label>
      <select
        id={id}
        className={inputClass}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === NEW_OPTION) {
            setAdding(true)
            return
          }
          onChange(e.target.value)
        }}
      >
        <option value="">{disabled ? disabledPlaceholder : loading ? 'Carregando...' : 'Selecione'}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {!disabled && <option value={NEW_OPTION}>+ Adicionar nova {label.toLowerCase()}</option>}
      </select>
    </div>
  )
}

function FornecedorPicker({
  fornecedor,
  onSelect,
  onClear,
}: {
  fornecedor: Fornecedor | null
  onSelect: (f: Fornecedor) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      api
        .listFornecedores({ search: q, pageSize: 8 })
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  if (fornecedor) {
    return (
      <div className="flex flex-col gap-1 col-span-2">
        <label className={labelClass}>Fornecedor *</label>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-[#13294b]">{fornecedor.razao_social}</span>
            <span className="text-xs text-gray-500">{formatCpfCnpj(fornecedor.cpf_cnpj)}</span>
          </div>
          <button type="button" onClick={onClear} className="text-xs font-medium text-[#2f6fed] hover:underline">
            Trocar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-1 col-span-2">
      <label htmlFor="fornecedor-search" className={labelClass}>
        CPF/CNPJ do Fornecedor *
      </label>
      <input
        id="fornecedor-search"
        className={inputClass}
        value={query}
        placeholder="Digite o CPF ou CNPJ do fornecedor"
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150)
        }}
      />
      {open && query.trim() && (
        <div className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-400">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">Nenhum fornecedor encontrado.</div>
          ) : (
            results.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (blurTimeout.current) clearTimeout(blurTimeout.current)
                  onSelect(f)
                  setQuery('')
                  setOpen(false)
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-[#13294b]">{formatCpfCnpj(f.cpf_cnpj)}</span>
                <span className="text-xs text-gray-500">{f.razao_social}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function useRegionais() {
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

function useSeccionais(regional: string) {
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

function FormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<NotaPayload>(EMPTY_FORM)
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { ufs } = useUFs()
  const { municipios, loading: municipiosLoading } = useMunicipios(form.uf)
  const { regionais, loading: regionaisLoading, reload: reloadRegionais } = useRegionais()
  const { seccionais, loading: seccionaisLoading, reload: reloadSeccionais } = useSeccionais(form.regional)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(EMPTY_FORM)
    setFornecedor(null)
  }, [open])

  function set<K extends keyof NotaPayload>(key: K, value: NotaPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleCreateRegional(nome: string) {
    await api.createRegional(nome)
    reloadRegionais()
  }

  async function handleCreateSeccional(nome: string) {
    await api.createSeccional(nome, form.regional)
    reloadSeccionais()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (
      !form.numero.trim() ||
      !form.operacao ||
      !form.regional ||
      !form.seccional ||
      !form.uf ||
      !form.cidade ||
      !form.fornecedor_id ||
      !form.numero_nota.trim() ||
      !form.valor.trim() ||
      !form.data_emissao ||
      !form.contrato ||
      !form.centro_custo ||
      !form.categoria
    ) {
      setError(
        'N° do Arquivo, Operação, Regional, Seccional, UF, Cidade, Fornecedor, N° da Nota, Valor, Data de Emissão, Contrato, Centro de Custo e Categoria são obrigatórios.',
      )
      return
    }

    const valorNumber = Number(form.valor.replace(',', '.'))
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      setError('Valor inválido.')
      return
    }

    setSubmitting(true)
    try {
      await api.createNota({ ...form, valor: String(valorNumber) })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a nota fiscal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova Nota Fiscal"
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
            form="nota-form"
            disabled={submitting}
            className="rounded-lg bg-[#13294b] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d1e38] disabled:opacity-50"
          >
            {submitting ? 'Criando...' : 'Criar'}
          </button>
        </>
      }
    >
      <form id="nota-form" onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#13294b]">Identificação</h3>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="numero" label="N° do Arquivo *" value={form.numero} onChange={(v) => set('numero', v)} />

            <div className="flex flex-col gap-1">
              <label htmlFor="operacao" className={labelClass}>
                Operação *
              </label>
              <select
                id="operacao"
                className={inputClass}
                value={form.operacao}
                onChange={(e) => set('operacao', e.target.value)}
              >
                <option value="">Selecione</option>
                {OPERACOES.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <CreatableSelect
              id="regional"
              label="Regional"
              value={form.regional}
              onChange={(v) => {
                set('regional', v)
                set('seccional', '')
              }}
              options={regionais}
              loading={regionaisLoading}
              onCreate={handleCreateRegional}
            />

            <CreatableSelect
              id="seccional"
              label="Seccional"
              value={form.seccional}
              onChange={(v) => set('seccional', v)}
              options={seccionais}
              loading={seccionaisLoading}
              onCreate={handleCreateSeccional}
              disabled={!form.regional}
              disabledPlaceholder="Selecione a Regional primeiro"
            />

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
          <h3 className="text-sm font-semibold text-[#13294b]">Fornecedor e Nota Fiscal</h3>
          <div className="grid grid-cols-2 gap-3">
            <FornecedorPicker
              fornecedor={fornecedor}
              onSelect={(f) => {
                setFornecedor(f)
                set('fornecedor_id', f.id)
              }}
              onClear={() => {
                setFornecedor(null)
                set('fornecedor_id', null)
              }}
            />

            <TextField id="numero_nota" label="N° da Nota *" value={form.numero_nota} onChange={(v) => set('numero_nota', v)} />
            <TextField id="valor" label="Valor *" type="number" value={form.valor} onChange={(v) => set('valor', v)} />
            <TextField
              id="data_emissao"
              label="Data de Emissão *"
              type="date"
              value={form.data_emissao}
              onChange={(v) => set('data_emissao', v)}
            />
            <TextField id="placa" label="Placa" value={form.placa} onChange={(v) => set('placa', v)} />
            <TextField id="descricao" label="Descrição" value={form.descricao} onChange={(v) => set('descricao', v)} span2 />

            <SelectField
              id="contrato"
              label="Contrato"
              value={form.contrato}
              onChange={(v) => set('contrato', v)}
              options={CONTRATOS.map((c) => ({ value: c, label: c }))}
            />
            <SelectField
              id="centro_custo"
              label="Centro de Custo"
              value={form.centro_custo}
              onChange={(v) => set('centro_custo', v)}
              options={CENTROS_CUSTO}
            />
            <SelectField
              id="categoria"
              label="Categoria"
              value={form.categoria}
              onChange={(v) => set('categoria', v)}
              options={CATEGORIAS}
            />

            <TextField id="observacao" label="Observação" value={form.observacao} onChange={(v) => set('observacao', v)} span2 />
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

export default function NotasFiscaisPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function handleSaved() {
    setFormOpen(false)
    setToast('Nota fiscal criada com sucesso.')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#13294b]">Notas Fiscais</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-lg bg-[#13294b] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d1e38]"
        >
          + Nova Nota Fiscal
        </button>
      </div>

      <PagePlaceholder title="Notas Fiscais" />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[#13294b] px-4 py-3 text-sm text-white shadow-xl">{toast}</div>
      )}
    </div>
  )
}
