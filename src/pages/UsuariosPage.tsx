import { useEffect, useState, type FormEvent } from 'react'
import Modal from '../components/Modal'
import LabeledSelect from '../components/LabeledSelect'
import * as api from '../lib/api'
import type { User, UserPayload } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useRegionais, useSeccionais } from '../hooks/useRegionaisSeccionais'

const ROLES: { value: string; label: string }[] = [
  { value: 'user_padrao', label: 'Usuário Padrão' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'adm', label: 'Administrador' },
]

function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

const EMPTY_FORM: UserPayload = {
  username: '',
  email: '',
  password: '',
  regional: '',
  seccional: '',
  setor: '',
  role: 'user_padrao',
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#0e7c86] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20'
const labelClass = 'text-xs font-medium text-[#0e7c86]'

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} type={type} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
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

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="15" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 12.5L19 4M16.5 6.5L19 9M14 9l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FormModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing: User | null
}) {
  const [form, setForm] = useState<UserPayload>(EMPTY_FORM)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { regionais, loading: regionaisLoading } = useRegionais()
  const { seccionais, loading: seccionaisLoading } = useSeccionais(form.regional)

  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmPassword('')
    if (editing) {
      setForm({
        username: editing.username,
        email: editing.email,
        password: '',
        regional: editing.regional,
        seccional: editing.seccional,
        setor: editing.setor ?? '',
        role: editing.role,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editing])

  function set<K extends keyof UserPayload>(key: K, value: UserPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.username.trim() || !form.email.trim() || !form.regional.trim() || !form.seccional.trim() || !form.setor.trim()) {
      setError('Usuário, e-mail, regional, seccional e setor são obrigatórios.')
      return
    }
    if (!editing) {
      if (!form.password.trim()) {
        setError('Senha é obrigatória para novo usuário.')
        return
      }
      if (form.password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.updateUser(editing.id, {
          username: form.username.trim(),
          email: form.email.trim(),
          regional: form.regional.trim(),
          seccional: form.seccional.trim(),
          setor: form.setor.trim(),
          role: form.role,
        })
      } else {
        await api.createUser({ ...form, username: form.username.trim(), email: form.email.trim() })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o usuário.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Usuário' : 'Novo Usuário'}
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
            type="submit"
            form="user-form"
            disabled={submitting}
            className="rounded-lg bg-[#0e7c86] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a616a] disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <TextField id="username" label="Usuário *" value={form.username} onChange={(v) => set('username', v)} />
          <TextField id="email" label="E-mail *" type="email" value={form.email} onChange={(v) => set('email', v)} />
          {!editing && (
            <>
              <TextField
                id="password"
                label="Senha *"
                type="password"
                value={form.password}
                onChange={(v) => set('password', v)}
              />
              <TextField
                id="confirm_password"
                label="Confirmar Senha *"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </>
          )}
          <LabeledSelect
            id="regional"
            label="Regional"
            value={form.regional}
            onChange={(v) => {
              set('regional', v)
              set('seccional', '')
            }}
            options={regionais}
            loading={regionaisLoading}
          />
          <LabeledSelect
            id="seccional"
            label="Seccional"
            value={form.seccional}
            onChange={(v) => set('seccional', v)}
            options={seccionais}
            loading={seccionaisLoading}
            disabled={!form.regional}
            disabledPlaceholder="Selecione a Regional primeiro"
          />
          <TextField id="setor" label="Setor *" value={form.setor} onChange={(v) => set('setor', v)} />

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className={labelClass}>
              Papel *
            </label>
            <select id="role" className={inputClass} value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!editing && <p className="-mt-2 text-xs text-gray-500">A senha deve ter ao menos 8 caracteres, incluindo um número e um caractere especial.</p>}

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function PasswordModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      await api.updateUserPassword(user.id, password)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Trocar Senha — ${user?.username ?? ''}`}
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
            type="submit"
            form="password-form"
            disabled={submitting}
            className="rounded-lg bg-[#0e7c86] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a616a] disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="password-form" onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <TextField id="new_password" label="Nova Senha *" type="password" value={password} onChange={setPassword} />
        <TextField
          id="confirm_new_password"
          label="Confirmar Nova Senha *"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <p className="-mt-2 text-xs text-gray-500">A senha deve ter ao menos 8 caracteres, incluindo um número e um caractere especial.</p>
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
  user,
  onClose,
  onConfirm,
  deleting,
}: {
  user: User | null
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Apagar Usuário"
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
        Tem certeza que deseja apagar o usuário <strong className="text-[#0e7c86]">{user?.username}</strong>? Essa ação não
        pode ser desfeita.
      </p>
    </Modal>
  )
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [changingPassword, setChangingPassword] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    api
      .listUsers()
      .then((res) => setData(res.data))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setFormOpen(true)
  }

  function handleSaved() {
    setFormOpen(false)
    setToast(editing ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.')
    reload()
  }

  function handlePasswordSaved() {
    setChangingPassword(null)
    setToast('Senha alterada com sucesso.')
  }

  async function handleApprove(u: User) {
    try {
      await api.approveUser(u.id)
      setToast(`Acesso de ${u.username} aprovado.`)
      reload()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao aprovar usuário.')
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.deleteUser(deleting.id)
      setDeleting(null)
      setToast('Usuário apagado com sucesso.')
      reload()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao apagar usuário.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#0e7c86]">Usuários</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#0e7c86] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a616a]"
        >
          + Novo Usuário
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-220 text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">E-mail</th>
              <th className="px-3 py-2 text-left">Regional</th>
              <th className="px-3 py-2 text-left">Seccional</th>
              <th className="px-3 py-2 text-left">Setor</th>
              <th className="px-3 py-2 text-left">Papel</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : loadError ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-red-500">
                  {loadError}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              data.map((u) => (
                <tr key={u.id} className={u.status === 'pendente' ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2 text-[#0e7c86]">{u.username}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{u.email}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{u.regional}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{u.seccional}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{u.setor ?? '—'}</td>
                  <td className="px-3 py-2 text-[#0e7c86]">{roleLabel(u.role)}</td>
                  <td className="px-3 py-2">
                    {u.status === 'pendente' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Pendente
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Aprovado</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1 text-gray-400">
                      {u.status === 'pendente' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(u)}
                          title="Aprovar acesso"
                          className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-[#0e7c86]"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangingPassword(u)}
                        title="Trocar Senha"
                        className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-[#0e7c86]"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? 'Você não pode apagar sua própria conta' : 'Apagar'}
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
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

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} editing={editing} />
      <PasswordModal user={changingPassword} onClose={() => setChangingPassword(null)} onSaved={handlePasswordSaved} />
      <DeleteModal user={deleting} onClose={() => setDeleting(null)} onConfirm={handleDeleteConfirm} deleting={deleteBusy} />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-[#0e7c86] px-4 py-3 text-sm text-white shadow-xl">{toast}</div>
      )}
    </div>
  )
}
