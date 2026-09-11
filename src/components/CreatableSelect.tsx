import { useState } from 'react'

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#0e7c86] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20'
const labelClass = 'text-xs font-medium text-[#0e7c86]'

const NEW_OPTION = '__new__'

export default function CreatableSelect({
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
            className="shrink-0 rounded-lg bg-[#0e7c86] px-3 py-2 text-xs font-medium text-white hover:bg-[#0a616a] disabled:opacity-50"
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
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-[#0e7c86] hover:bg-gray-50"
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
