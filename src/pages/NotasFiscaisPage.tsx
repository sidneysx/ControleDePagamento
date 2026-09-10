import { useEffect, useRef, useState, type FormEvent } from 'react'
import Modal from '../components/Modal'
import * as api from '../lib/api'
import type { Fornecedor, Nota, NotaPayload } from '../lib/api'
import { useMunicipios, useUFs } from '../lib/ibge'
import { formatCpfCnpj, formatCurrency, formatDate, formatNumeroNota } from '../lib/format'

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

function toPlainOptions(values: string[]): { value: string; label: string }[] {
  return values.map((value) => ({ value, label: value })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

const OPERACOES = alphaSort(['Administrativo', 'Comercial', 'Logística', 'Perdas', 'PLPT', 'Técnica'])
const CONTRATOS = alphaSort(['Âncora', 'DPL', 'LV AT', 'PLPT', 'Transmissão', 'Transporte'])
const TIPOS_PAGAMENTO = alphaSort(['Boleto', 'Pix', 'Transferência'])

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
  tipo_pagamento: '',
  pagamento_favorecido: '',
  pagamento_cpf_cnpj: '',
  pagamento_banco: '',
  pagamento_agencia: '',
  pagamento_conta: '',
  pagamento_pix_tipo_chave: '',
  pagamento_pix_chave: '',
  data_programacao: '',
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
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  span2?: boolean
  placeholder?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ReadOnlyField({ id, label, value, span2 }: { id: string; label: string; value: string; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div id={id} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#13294b]">
        {value || '—'}
      </div>
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  disabledPlaceholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  disabledPlaceholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label} *
      </label>
      <select id={id} className={inputClass} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">{disabled ? disabledPlaceholder : 'Selecione'}</option>
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

function FileDropZone({
  id,
  label,
  file,
  onChange,
}: {
  id: string
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-1 col-span-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onChange(f)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition-colors ${
          dragOver ? 'border-[#13294b] bg-[#13294b]/5' : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
        {file ? (
          <div className="flex items-center gap-2 text-[#13294b]">
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-xs font-medium text-red-500 hover:underline"
            >
              Remover
            </button>
          </div>
        ) : (
          <span className="text-gray-400">Arraste o PDF aqui ou clique para selecionar</span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
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

function useCentrosCusto() {
  const [centrosCusto, setCentrosCusto] = useState<api.CentroCusto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listCentrosCusto()
      .then((res) => setCentrosCusto(res.data))
      .catch(() => setCentrosCusto([]))
      .finally(() => setLoading(false))
  }, [])

  return { centrosCusto, loading }
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

function fmt(value: string | null | undefined): string {
  return value && value.trim() ? value : '—'
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">{label}</dt>
      <dd className="text-sm text-[#13294b]">{value}</dd>
    </div>
  )
}

function DetailModal({ nota, onClose }: { nota: Nota | null; onClose: () => void }) {
  return (
    <Modal open={!!nota} onClose={onClose} title="Detalhes da Nota Fiscal" maxWidth="max-w-2xl">
      {nota && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Identificação</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="N° do Arquivo" value={fmt(nota.numero)} />
              <DetailRow label="Operação" value={fmt(nota.operacao)} />
              <DetailRow label="Regional" value={fmt(nota.regional)} />
              <DetailRow label="Seccional" value={fmt(nota.seccional)} />
              <DetailRow label="UF" value={fmt(nota.uf)} />
              <DetailRow label="Cidade" value={fmt(nota.cidade)} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Fornecedor e Nota Fiscal</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Fornecedor" value={fmt(nota.fornecedor_razao_social)} />
              <DetailRow label="CPF/CNPJ do Fornecedor" value={fmt(formatCpfCnpj(nota.fornecedor_cpf_cnpj))} />
              <DetailRow label="N° da Nota" value={fmt(formatNumeroNota(nota.numero_nota))} />
              <DetailRow label="Valor" value={formatCurrency(nota.valor)} />
              <DetailRow label="Data de Emissão" value={formatDate(nota.data_emissao)} />
              <DetailRow label="Placa" value={fmt(nota.placa)} />
              <DetailRow label="Contrato" value={fmt(nota.contrato)} />
              <DetailRow label="Centro de Custo" value={fmt(nota.centro_custo)} />
              <DetailRow label="Categoria" value={fmt(nota.categoria)} />
              <DetailRow label="Descrição" value={fmt(nota.descricao)} />
              <DetailRow label="Observação" value={fmt(nota.observacao)} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Dados do Pagamento</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Tipo de Pagamento" value={fmt(nota.tipo_pagamento)} />
              <DetailRow label="Favorecido" value={fmt(nota.pagamento_favorecido)} />
              <DetailRow label="CPF/CNPJ" value={fmt(formatCpfCnpj(nota.pagamento_cpf_cnpj))} />
              {nota.tipo_pagamento === 'Transferência' && (
                <>
                  <DetailRow label="Banco" value={fmt(nota.pagamento_banco)} />
                  <DetailRow label="Agência" value={fmt(nota.pagamento_agencia)} />
                  <DetailRow label="Conta" value={fmt(nota.pagamento_conta)} />
                </>
              )}
              {nota.tipo_pagamento === 'Pix' && (
                <>
                  <DetailRow label="Tipo da Chave" value={fmt(nota.pagamento_pix_tipo_chave)} />
                  <DetailRow label="Chave PIX" value={fmt(nota.pagamento_pix_chave)} />
                </>
              )}
              {nota.tipo_pagamento === 'Boleto' && (
                <div>
                  <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">Boleto</dt>
                  <dd className="text-sm">
                    {nota.boleto_arquivo ? (
                      <a
                        href={api.notaArquivoUrl(nota.id, 'boleto')}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#2f6fed] hover:underline"
                      >
                        {nota.boleto_arquivo_nome ?? 'Baixar arquivo'}
                      </a>
                    ) : (
                      <span className="text-[#13294b]">—</span>
                    )}
                  </dd>
                </div>
              )}
              <DetailRow label="Data da Programação" value={formatDate(nota.data_programacao)} />
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">Nota Fiscal Anexada</dt>
                <dd className="text-sm">
                  {nota.nota_fiscal_arquivo ? (
                    <a
                      href={api.notaArquivoUrl(nota.id, 'nota_fiscal')}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#2f6fed] hover:underline"
                    >
                      {nota.nota_fiscal_arquivo_nome ?? 'Baixar arquivo'}
                    </a>
                  ) : (
                    <span className="text-[#13294b]">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#13294b]">Lançamento</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Lançado por" value={fmt(nota.created_by_username)} />
              <DetailRow label="Data do Lançamento" value={formatDate(nota.created_at)} />
            </dl>
          </section>
        </div>
      )}
    </Modal>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function FormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<NotaPayload>(EMPTY_FORM)
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [boletoFile, setBoletoFile] = useState<File | null>(null)
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { ufs } = useUFs()
  const { municipios, loading: municipiosLoading } = useMunicipios(form.uf)
  const { regionais, loading: regionaisLoading, reload: reloadRegionais } = useRegionais()
  const { seccionais, loading: seccionaisLoading, reload: reloadSeccionais } = useSeccionais(form.regional)
  const { centrosCusto, loading: centrosCustoLoading } = useCentrosCusto()

  const centroCustoOptions = toOptions(centrosCusto.map((c) => c.centro_custo))
  const categoriaOptions = toPlainOptions(
    centrosCusto.find((c) => c.centro_custo === form.centro_custo)?.categorias ?? [],
  )

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(EMPTY_FORM)
    setFornecedor(null)
    setBoletoFile(null)
    setNotaFiscalFile(null)
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
      !form.categoria ||
      !form.tipo_pagamento ||
      !form.pagamento_favorecido.trim() ||
      !form.pagamento_cpf_cnpj.trim() ||
      !form.data_programacao
    ) {
      setError(
        'N° do Arquivo, Operação, Regional, Seccional, UF, Cidade, Fornecedor, N° da Nota, Valor, Data de Emissão, Contrato, Centro de Custo, Categoria, Tipo de Pagamento, Favorecido, CPF/CNPJ e Data da Programação são obrigatórios.',
      )
      return
    }

    if (form.tipo_pagamento === 'Transferência' && (!form.pagamento_banco.trim() || !form.pagamento_agencia.trim() || !form.pagamento_conta.trim())) {
      setError('Banco, Agência e Conta são obrigatórios para pagamento por transferência.')
      return
    }
    if (form.tipo_pagamento === 'Pix' && (!form.pagamento_pix_tipo_chave || !form.pagamento_pix_chave.trim())) {
      setError('Tipo de Chave e Chave PIX são obrigatórios para pagamento por PIX.')
      return
    }

    const valorNumber = Number(form.valor.replace(',', '.'))
    if (!Number.isFinite(valorNumber) || valorNumber <= 0) {
      setError('Valor inválido.')
      return
    }

    setSubmitting(true)
    try {
      await api.createNota(
        { ...form, valor: String(valorNumber) },
        { boleto: boletoFile, notaFiscal: notaFiscalFile },
      )
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
                setForm((prev) => ({
                  ...prev,
                  fornecedor_id: f.id,
                  pagamento_favorecido: f.favorecido,
                  pagamento_cpf_cnpj: formatCpfCnpj(f.cpf_cnpj),
                  pagamento_banco: f.banco ?? '',
                  pagamento_agencia: f.agencia ?? '',
                  pagamento_conta: f.conta ?? '',
                  pagamento_pix_tipo_chave: f.pix_tipo_chave ?? '',
                  pagamento_pix_chave: f.pix_chave ?? '',
                }))
              }}
              onClear={() => {
                setFornecedor(null)
                set('fornecedor_id', null)
              }}
            />

            <TextField
              id="numero_nota"
              label="N° da Nota *"
              value={form.numero_nota}
              onChange={(v) => set('numero_nota', formatNumeroNota(v))}
              placeholder="000.000.000"
            />
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
              onChange={(v) => {
                set('centro_custo', v)
                set('categoria', '')
              }}
              options={centroCustoOptions}
              disabled={centrosCustoLoading}
              disabledPlaceholder="Carregando..."
            />
            <SelectField
              id="categoria"
              label="Categoria"
              value={form.categoria}
              onChange={(v) => set('categoria', v)}
              options={categoriaOptions}
              disabled={!form.centro_custo}
              disabledPlaceholder="Selecione o Centro de Custo primeiro"
            />

            <TextField id="observacao" label="Observação" value={form.observacao} onChange={(v) => set('observacao', v)} span2 />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#13294b]">Dados do Pagamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo_pagamento" className={labelClass}>
                Tipo de Pagamento *
              </label>
              <select
                id="tipo_pagamento"
                className={inputClass}
                value={form.tipo_pagamento}
                onChange={(e) => set('tipo_pagamento', e.target.value)}
              >
                <option value="">Selecione</option>
                {TIPOS_PAGAMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <ReadOnlyField id="pagamento_favorecido" label="Favorecido *" value={form.pagamento_favorecido} />
            <ReadOnlyField id="pagamento_cpf_cnpj" label="CPF/CNPJ *" value={form.pagamento_cpf_cnpj} />

            {form.tipo_pagamento === 'Transferência' && (
              <>
                <ReadOnlyField id="pagamento_banco" label="Banco *" value={form.pagamento_banco} />
                <ReadOnlyField id="pagamento_agencia" label="Agência *" value={form.pagamento_agencia} />
                <ReadOnlyField id="pagamento_conta" label="Conta *" value={form.pagamento_conta} />
              </>
            )}

            {form.tipo_pagamento === 'Pix' && (
              <>
                <ReadOnlyField id="pagamento_pix_tipo_chave" label="Tipo da Chave *" value={form.pagamento_pix_tipo_chave} />
                <ReadOnlyField id="pagamento_pix_chave" label="Chave PIX *" value={form.pagamento_pix_chave} />
              </>
            )}

            {form.tipo_pagamento === 'Boleto' && (
              <FileDropZone id="boleto_arquivo" label="Boleto (PDF, opcional)" file={boletoFile} onChange={setBoletoFile} />
            )}

            <TextField
              id="data_programacao"
              label="Data da Programação *"
              type="date"
              value={form.data_programacao}
              onChange={(v) => set('data_programacao', v)}
            />

            <FileDropZone
              id="nota_fiscal_arquivo"
              label="Anexar Nota Fiscal (PDF, opcional)"
              file={notaFiscalFile}
              onChange={setNotaFiscalFile}
            />
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
  const [data, setData] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Nota | null>(null)

  function reload() {
    setLoading(true)
    api
      .listNotas()
      .then((res) => setData(res.data))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar notas fiscais.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function handleSaved() {
    setFormOpen(false)
    setToast('Nota fiscal criada com sucesso.')
    reload()
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-220 text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">N° do Arquivo</th>
              <th className="px-4 py-3 text-left">Fornecedor</th>
              <th className="px-4 py-3 text-left">N° da Nota</th>
              <th className="px-4 py-3 text-left">Valor</th>
              <th className="px-4 py-3 text-left">Emissão</th>
              <th className="px-4 py-3 text-left">Programação</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows count={6} />
            ) : loadError ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-red-500">
                  {loadError}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhuma nota fiscal lançada.
                </td>
              </tr>
            ) : (
              data.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-[#13294b]">{n.numero}</td>
                  <td className="px-4 py-3 text-[#13294b]">{fmt(n.fornecedor_razao_social)}</td>
                  <td className="px-4 py-3 text-[#13294b]">{formatNumeroNota(n.numero_nota)}</td>
                  <td className="px-4 py-3 text-[#13294b]">{formatCurrency(n.valor)}</td>
                  <td className="px-4 py-3 text-[#13294b]">{formatDate(n.data_emissao)}</td>
                  <td className="px-4 py-3 text-[#13294b]">{formatDate(n.data_programacao)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setViewing(n)}
                      title="Ver mais"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#2f6fed] hover:bg-gray-100"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver mais
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      <DetailModal nota={viewing} onClose={() => setViewing(null)} />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[#13294b] px-4 py-3 text-sm text-white shadow-xl">{toast}</div>
      )}
    </div>
  )
}
