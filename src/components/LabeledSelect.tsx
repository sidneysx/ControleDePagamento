const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#0e7c86] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86]/20'
const labelClass = 'text-xs font-medium text-[#0e7c86]'

export default function LabeledSelect({
  id,
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  disabledPlaceholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  loading?: boolean
  disabled?: boolean
  disabledPlaceholder?: string
}) {
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
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{disabled ? disabledPlaceholder : loading ? 'Carregando...' : 'Selecione'}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
