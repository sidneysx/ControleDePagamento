import { useEffect, useState } from 'react'
import Modal from './Modal'
import * as api from '../lib/api'
import type { Nota } from '../lib/api'
import { formatCodeLabel, formatCpfCnpj, formatCurrency, formatDate, formatNumeroNota } from '../lib/format'
import { useAuth } from '../context/AuthContext'

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
      <dd className="text-sm text-[#0e7c86]">{value}</dd>
    </div>
  )
}

function PdfViewerModal({ file, onClose }: { file: { url: string; filename: string } | null; onClose: () => void }) {
  return (
    <Modal open={!!file} onClose={onClose} title={file?.filename ?? 'Arquivo'} maxWidth="max-w-5xl" hideScrollbar>
      {file && (
        <div className="flex flex-col gap-3">
          <iframe src={file.url} title={file.filename} className="h-[70vh] w-full rounded-lg border border-gray-200" />
          <a
            href={`${file.url}?download=1`}
            className="self-end rounded-lg bg-[#0e7c86] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a616a]"
          >
            Baixar PDF
          </a>
        </div>
      )}
    </Modal>
  )
}

function PdfFileLinks({
  filename,
  url,
  onView,
}: {
  filename: string | null
  url: string
  onView: (file: { url: string; filename: string }) => void
}) {
  if (!filename) return <span className="text-[#0e7c86]">—</span>
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onView({ url, filename })} className="font-medium text-[#0e7c86] hover:underline">
        Visualizar
      </button>
      <a href={`${url}?download=1`} className="text-xs text-gray-500 hover:underline">
        Baixar
      </a>
    </div>
  )
}

function useEditableDataProgramacao(nota: Nota, onSaved: () => void) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nota.data_programacao)
  const [current, setCurrent] = useState(nota.data_programacao)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setValue(current)
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    if (!value) return
    setSaving(true)
    setError(null)
    try {
      await api.updateNotaDataProgramacao(nota.id, value)
      setCurrent(value)
      setEditing(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  return { editing, value, setValue, current, saving, error, startEdit, cancelEdit, save }
}

function EditableDataProgramacao({ nota, onSaved }: { nota: Nota; onSaved: () => void }) {
  const { editing, value, setValue, current, saving, error, startEdit, cancelEdit, save } = useEditableDataProgramacao(
    nota,
    onSaved,
  )

  if (!editing) {
    return (
      <div>
        <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">Data da Programação</dt>
        <dd className="flex items-center gap-2 text-sm text-[#0e7c86]">
          {formatDate(current)}
          <button type="button" onClick={startEdit} className="text-xs font-medium text-[#0e7c86] hover:underline">
            Editar
          </button>
        </dd>
      </div>
    )
  }

  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">Data da Programação</dt>
      <dd className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-[#0e7c86] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#0e7c86] px-2 py-1 text-xs font-medium text-white hover:bg-[#0a616a] disabled:opacity-50"
          >
            {saving ? '...' : 'Salvar'}
          </button>
          <button type="button" onClick={cancelEdit} className="text-xs text-gray-500 hover:underline">
            Cancelar
          </button>
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </dd>
    </div>
  )
}

function EditableDataProgramacaoCell({ nota, onSaved }: { nota: Nota; onSaved: () => void }) {
  const { editing, value, setValue, current, saving, error, startEdit, cancelEdit, save } = useEditableDataProgramacao(
    nota,
    onSaved,
  )

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span>{formatDate(current)}</span>
        <button
          type="button"
          onClick={startEdit}
          title="Editar data da programação"
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-[#0e7c86]"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg border border-gray-200 px-1.5 py-1 text-xs text-[#0e7c86] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          title="Salvar"
          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={cancelEdit} title="Cancelar" className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

function DetailModal({
  nota,
  onClose,
  onDeleteRequest,
  onReload,
  isAdmin,
}: {
  nota: Nota | null
  onClose: () => void
  onDeleteRequest: (nota: Nota) => void
  onReload: () => void
  isAdmin: boolean
}) {
  const [pdfFile, setPdfFile] = useState<{ url: string; filename: string } | null>(null)

  return (
    <Modal open={!!nota} onClose={onClose} title="Detalhes da Nota Fiscal" maxWidth="max-w-2xl" hideScrollbar>
      {nota && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#0e7c86]">Identificação</h3>
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
            <h3 className="mb-3 text-sm font-semibold text-[#0e7c86]">Fornecedor e Nota Fiscal</h3>
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
            <h3 className="mb-3 text-sm font-semibold text-[#0e7c86]">Dados do Pagamento</h3>
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
                    <PdfFileLinks
                      filename={nota.boleto_arquivo_nome}
                      url={api.notaArquivoUrl(nota.id, 'boleto')}
                      onView={setPdfFile}
                    />
                  </dd>
                </div>
              )}
              {isAdmin ? (
                <EditableDataProgramacao key={nota.id} nota={nota} onSaved={onReload} />
              ) : (
                <DetailRow label="Data da Programação" value={formatDate(nota.data_programacao)} />
              )}
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-400 uppercase">Nota Fiscal Anexada</dt>
                <dd className="text-sm">
                  <PdfFileLinks
                    filename={nota.nota_fiscal_arquivo_nome}
                    url={api.notaArquivoUrl(nota.id, 'nota_fiscal')}
                    onView={setPdfFile}
                  />
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#0e7c86]">Lançamento</h3>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow label="Lançado por" value={fmt(nota.created_by_username)} />
              <DetailRow label="Data do Lançamento" value={formatDate(nota.created_at)} />
            </dl>
          </section>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => onDeleteRequest(nota)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Apagar Nota Fiscal
            </button>
          </div>
        </div>
      )}

      <PdfViewerModal file={pdfFile} onClose={() => setPdfFile(null)} />
    </Modal>
  )
}

function DeleteModal({
  nota,
  onClose,
  onConfirm,
  deleting,
}: {
  nota: Nota | null
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <Modal
      open={!!nota}
      onClose={onClose}
      title="Apagar Nota Fiscal"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#0e7c86] hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Apagando...' : 'Apagar'}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Tem certeza que deseja apagar a nota fiscal <strong className="text-[#0e7c86]">{nota?.numero}</strong>? Essa ação não
        pode ser desfeita.
      </p>
    </Modal>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 10 }).map((_, j) => (
            <td key={j} className="px-3 py-2">
              <div className="h-4 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function NotasTable({
  data,
  loading,
  loadError,
  onReload,
  emptyMessage = 'Nenhuma nota fiscal encontrada.',
}: {
  data: Nota[]
  loading: boolean
  loadError: string | null
  onReload: () => void
  emptyMessage?: string
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'adm'

  const [viewing, setViewing] = useState<Nota | null>(null)
  const [deleting, setDeleting] = useState<Nota | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function handleDeleteRequest(nota: Nota) {
    setViewing(null)
    setDeleting(nota)
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.deleteNota(deleting.id)
      setDeleting(null)
      setToast('Nota fiscal apagada com sucesso.')
      onReload()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao apagar nota fiscal.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-280 text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">N° do Arquivo</th>
              <th className="px-3 py-2 text-left">Regional</th>
              <th className="px-3 py-2 text-left">Seccional</th>
              <th className="px-3 py-2 text-left">Fornecedor</th>
              <th className="px-3 py-2 text-left">Centro de Custo</th>
              <th className="px-3 py-2 text-left">N° da Nota</th>
              <th className="px-3 py-2 text-left">Valor</th>
              <th className="px-3 py-2 text-left">Emissão</th>
              <th className="px-3 py-2 text-left">Programação</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows count={6} />
            ) : loadError ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-red-500">
                  {loadError}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-[#0e7c86]">{n.numero}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{fmt(n.regional)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{fmt(n.seccional)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{fmt(n.fornecedor_razao_social)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{formatCodeLabel(n.centro_custo)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{formatNumeroNota(n.numero_nota)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{formatCurrency(n.valor)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{formatDate(n.data_emissao)}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">
                    {isAdmin ? (
                      <EditableDataProgramacaoCell nota={n} onSaved={onReload} />
                    ) : (
                      formatDate(n.data_programacao)
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setViewing(n)}
                      title="Ver mais"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#0e7c86] hover:bg-gray-100"
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

      <DetailModal
        nota={viewing}
        onClose={() => setViewing(null)}
        onDeleteRequest={handleDeleteRequest}
        onReload={onReload}
        isAdmin={isAdmin}
      />
      <DeleteModal nota={deleting} onClose={() => setDeleting(null)} onConfirm={handleDeleteConfirm} deleting={deleteBusy} />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[#0e7c86] px-4 py-3 text-sm text-white shadow-xl">{toast}</div>
      )}
    </>
  )
}
