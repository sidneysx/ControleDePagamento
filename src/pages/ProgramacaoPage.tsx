import { useEffect, useState } from 'react'
import NotasTable from '../components/NotasTable'
import * as api from '../lib/api'
import type { Nota, Programacao } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/format'
import { exportNotasToExcel } from '../lib/exportNotas'

function toISODate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getTodayISO(): string {
  return toISODate(new Date())
}

function getNextWednesdayISO(): string {
  const today = new Date()
  const diff = (3 - today.getDay() + 7) % 7
  return toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff))
}

function sortProgramacoes(list: Programacao[]): Programacao[] {
  const todayISO = getTodayISO()
  return [...list].sort((a, b) => {
    const aUpcoming = a.data_programacao >= todayISO
    const bUpcoming = b.data_programacao >= todayISO
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
    return aUpcoming
      ? a.data_programacao.localeCompare(b.data_programacao)
      : b.data_programacao.localeCompare(a.data_programacao)
  })
}

function formatWeekday(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
      ))}
    </div>
  )
}

function ProgramacaoDetail({ date, onBack }: { date: string; onBack: () => void }) {
  const [data, setData] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    api
      .listNotas({ dataProgramacao: date })
      .then((res) => setData(res.data))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar notas fiscais.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [date])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-sm font-medium text-[#0e7c86] hover:underline">
            ← Voltar
          </button>
          <h1 className="mt-1 text-xl font-semibold text-[#0e7c86]">
            Programação de {formatWeekday(date)}, {formatDate(date)}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => exportNotasToExcel(data)}
          disabled={data.length === 0}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0e7c86] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Baixar Excel
        </button>
      </div>

      <NotasTable
        data={data}
        loading={loading}
        loadError={loadError}
        onReload={reload}
        emptyMessage="Nenhuma nota fiscal nesta programação."
      />
    </div>
  )
}

export default function ProgramacaoPage() {
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    api
      .listProgramacoes()
      .then((res) => setProgramacoes(sortProgramacoes(res.data)))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erro ao carregar programações.'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  if (selected) {
    return (
      <ProgramacaoDetail
        date={selected}
        onBack={() => {
          setSelected(null)
          reload()
        }}
      />
    )
  }

  const nextWednesday = getNextWednesdayISO()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[#0e7c86]">Programação</h1>
      <p className="text-sm text-gray-500">Pagamentos são programados sempre para quarta-feira. Selecione uma programação para ver as notas.</p>

      {loading ? (
        <SkeletonCards />
      ) : loadError ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-red-500">{loadError}</div>
      ) : programacoes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
          Nenhuma programação encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programacoes.map((p) => (
            <button
              key={p.data_programacao}
              type="button"
              onClick={() => setSelected(p.data_programacao)}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[#0e7c86]/40 hover:bg-[#0e7c86]/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#0e7c86]">{formatWeekday(p.data_programacao)}</span>
                {p.data_programacao === nextWednesday && (
                  <span className="rounded-full bg-[#f2a93a]/15 px-2 py-0.5 text-[11px] font-semibold text-[#b9740a]">
                    Próxima
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{formatDate(p.data_programacao)}</span>
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
                <span className="text-gray-500">{p.total_notas} nota(s)</span>
                <span className="font-medium text-[#0e7c86]">{formatCurrency(p.valor_total)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
