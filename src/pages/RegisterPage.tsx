import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

type FieldProps = {
  id: string
  label: string
  type?: string
  autoComplete?: string
  value: string
  onChange: (value: string) => void
}

function Field({ id, label, type = 'text', autoComplete, value, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#13294b]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[#13294b] outline-none focus:border-[#13294b] focus:ring-2 focus:ring-[#13294b]/20"
      />
    </div>
  )
}

const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_HINT = 'A senha deve ter ao menos 8 caracteres, incluindo um número e um caractere especial.'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [regional, setRegional] = useState('')
  const [seccional, setSeccional] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!PASSWORD_RULE.test(password)) {
      setError(PASSWORD_HINT)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      await register({ username, email, password, regional, seccional })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-center text-2xl font-bold text-[#13294b]">Criar conta</h1>
      <p className="mt-1 text-center text-sm text-gray-500">Preencha os dados para acessar o sistema</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field id="username" label="Usuário" autoComplete="username" value={username} onChange={setUsername} />
        <Field id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Field
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <p className="-mt-2 text-xs text-gray-500">{PASSWORD_HINT}</p>

        <Field
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field id="regional" label="Regional" value={regional} onChange={setRegional} />
          <Field id="seccional" label="Seccional" value={seccional} onChange={setSeccional} />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-[#13294b] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#0d1e38] disabled:opacity-50"
        >
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>

        <Link to="/login" className="text-center text-sm text-[#2f6fed] hover:underline">
          Já tenho uma conta
        </Link>
      </form>
    </AuthLayout>
  )
}
