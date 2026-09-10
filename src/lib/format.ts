export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return ''
  const digits = onlyDigits(value)
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

export function formatNumeroNota(value: string): string {
  const digits = onlyDigits(value).slice(0, 9)
  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3))
  }
  return parts.join('.')
}

export function formatCurrency(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCurrencyInput(value: string): string {
  const digits = onlyDigits(value)
  const cents = digits ? parseInt(digits, 10) : 0
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function currencyInputToDecimalString(value: string): string {
  const digits = onlyDigits(value)
  const cents = digits ? parseInt(digits, 10) : 0
  return (cents / 100).toFixed(2)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatCodeLabel(raw: string): string {
  return raw
    .split('_')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ')
}
