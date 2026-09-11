import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import NotasTable from '../components/NotasTable'
import * as api from '../lib/api'
import type { Nota, Programacao } from '../lib/api'
import { formatCodeLabel, formatCurrency, formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'

const CARD = 'rounded-xl border border-gray-200 bg-white'
const TEAL = '#0e7c86'
const ORANGE = '#f2a93a'

function toISODate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getTodayISO(): string {
  return toISODate(new Date())
}

function formatWeekday(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

function nextUpcomingProgramacao(list: Programacao[]): Programacao | null {
  const todayISO = getTodayISO()
  const upcoming = list
    .filter((p) => p.data_programacao >= todayISO)
    .sort((a, b) => a.data_programacao.localeCompare(b.data_programacao))
  return upcoming[0] ?? null
}

function groupByValor(notas: Nota[], key: 'centro_custo' | 'contrato' | 'operacao' | 'regional' | 'seccional', formatLabel?: (v: string) => string) {
  const map = new Map<string, number>()
  for (const n of notas) {
    const raw = n[key] || '—'
    const label = formatLabel ? formatLabel(raw) : raw
    map.set(label, (map.get(label) ?? 0) + Number(n.valor))
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function StatIcon({ children }: { children: ReactNode }) {
  return <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-current/10">{children}</div>
}

function InvoiceGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6M9 8h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CoinGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v9M9.5 9.7c0-1.2 1.1-2.2 2.5-2.2s2.5 1 2.5 2.1c0 2.9-5 1.5-5 4.3 0 1.2 1.1 2.1 2.5 2.1s2.5-.9 2.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12.3l2.4 2.4 4.6-5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function StatTile({
  label,
  value,
  sub,
  accent,
  icon,
  onClick,
}: {
  label: string
  value: string
  sub?: string
  accent: string
  icon: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${CARD} flex flex-col gap-3 p-5 text-left transition-colors ${onClick ? 'hover:border-[#0e7c86]/40 hover:bg-[#0e7c86]/5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span style={{ color: accent }}>
          <StatIcon>{icon}</StatIcon>
        </span>
      </div>
      <span className="text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </Tag>
  )
}

function BarList({
  title,
  rows,
  color,
  emptyMessage = 'Sem lançamentos no período.',
  cap = 6,
}: {
  title: string
  rows: { label: string; value: number }[]
  color: string
  emptyMessage?: string
  cap?: number
}) {
  const visible = rows.slice(0, cap)
  const rest = rows.slice(cap)
  if (rest.length > 0) {
    visible.push({ label: `Outros (${rest.length})`, value: rest.reduce((s, r) => s + r.value, 0) })
  }
  const max = Math.max(...visible.map((r) => r.value), 1)

  return (
    <div className={`${CARD} p-5`}>
      <h2 className="text-sm font-semibold text-[#0e7c86]">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {visible.map((r) => (
            <div key={r.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-gray-600">{r.label}</span>
                <span className="shrink-0 font-semibold text-[#0e7c86]">{formatCurrency(r.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  title={`${r.label}: ${formatCurrency(r.value)}`}
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${Math.max((r.value / max) * 100, 3)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'adm'
  const isFinanceiro = user?.role === 'financeiro'

  const [notas, setNotas] = useState<Nota[]>([])
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    setLoadError(null)
    Promise.all([api.listNotas({}), api.listProgramacoes()])
      .then(([n, p]) => {
        setNotas(n.data)
        setProgramacoes(p.data)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  const stats = useMemo(() => {
    const total = notas.length
    const valorTotal = notas.reduce((s, n) => s + Number(n.valor), 0)
    const pendentes = notas.filter((n) => !n.pago)
    const pagas = notas.filter((n) => n.pago)
    return {
      total,
      valorTotal,
      pendentesCount: pendentes.length,
      valorPendente: pendentes.reduce((s, n) => s + Number(n.valor), 0),
      pagasCount: pagas.length,
      valorPago: pagas.reduce((s, n) => s + Number(n.valor), 0),
    }
  }, [notas])

  const proxima = useMemo(() => nextUpcomingProgramacao(programacoes), [programacoes])

  const porCentroCusto = useMemo(() => groupByValor(notas, 'centro_custo', formatCodeLabel), [notas])
  const porContrato = useMemo(() => groupByValor(notas, 'contrato'), [notas])
  const porOperacao = useMemo(() => groupByValor(notas, 'operacao'), [notas])
  const porRegional = useMemo(() => groupByValor(notas, 'regional'), [notas])
  const porSeccional = useMemo(() => groupByValor(notas, 'seccional'), [notas])

  const recentes = notas.slice(0, 6)

  const scopeLabel = isAdmin
    ? 'Visão geral de todas as regionais'
    : isFinanceiro
      ? `Visão geral da regional ${user?.regional}`
      : `Notas da seccional ${user?.seccional} — ${user?.regional}`

  const charts: { title: string; rows: { label: string; value: number }[]; color: string }[] = [
    { title: 'Por Centro de Custo', rows: porCentroCusto, color: TEAL },
    { title: 'Por Contrato', rows: porContrato, color: TEAL },
    { title: 'Por Operação', rows: porOperacao, color: TEAL },
  ]
  if (isAdmin) charts.push({ title: 'Por Regional', rows: porRegional, color: ORANGE })
  if (isFinanceiro) charts.push({ title: 'Por Seccional', rows: porSeccional, color: ORANGE })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#0e7c86]">Dashboard</h1>
        <p className="text-sm text-gray-500">{scopeLabel}</p>
      </div>

      {loading ? (
        <SkeletonDashboard />
      ) : loadError ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-red-500">{loadError}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile
              label="Total de Notas"
              value={String(stats.total)}
              sub={formatCurrency(stats.valorTotal)}
              accent={TEAL}
              icon={<InvoiceGlyph />}
              onClick={() => navigate('/notas-fiscais')}
            />
            <StatTile label="Valor Total" value={formatCurrency(stats.valorTotal)} accent={TEAL} icon={<CoinGlyph />} />
            <StatTile
              label="Pendentes"
              value={String(stats.pendentesCount)}
              sub={formatCurrency(stats.valorPendente)}
              accent="#b9740a"
              icon={<ClockGlyph />}
            />
            <StatTile
              label="Pagas"
              value={String(stats.pagasCount)}
              sub={formatCurrency(stats.valorPago)}
              accent="#0f8a3f"
              icon={<CheckGlyph />}
            />
            <StatTile
              label="Próxima Programação"
              value={proxima ? formatWeekday(proxima.data_programacao) : '—'}
              sub={
                proxima
                  ? `${formatDate(proxima.data_programacao)} · ${proxima.total_notas} nota(s) · ${formatCurrency(proxima.valor_total)}`
                  : 'Nenhuma programação futura'
              }
              accent={ORANGE}
              icon={<CalendarGlyph />}
              onClick={() => navigate('/programacao')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {charts.map((c) => (
              <BarList key={c.title} title={c.title} rows={c.rows} color={c.color} />
            ))}
          </div>

          <div className={`${CARD} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0e7c86]">Últimas Notas Lançadas</h2>
              <button
                type="button"
                onClick={() => navigate('/notas-fiscais')}
                className="text-sm font-medium text-[#0e7c86] hover:underline"
              >
                Ver todas
              </button>
            </div>
            <NotasTable
              data={recentes}
              loading={false}
              loadError={null}
              onReload={reload}
              emptyMessage="Nenhuma nota fiscal lançada."
            />
          </div>
        </>
      )}
    </div>
  )
}
