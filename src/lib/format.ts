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
