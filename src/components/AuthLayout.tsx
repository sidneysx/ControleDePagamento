import type { ReactNode } from 'react'

const HERO_GRADIENT = 'bg-[linear-gradient(135deg,#0a5c67_0%,#0e7c86_55%,#149aa7_100%)]'

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3.5h7l4 4V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f2a93a]">
        {icon}
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="text-xs leading-snug text-white/60">{desc}</div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`relative min-h-svh overflow-hidden lg:grid lg:grid-cols-2 ${HERO_GRADIENT}`}>
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
        <div className="animate-float-a absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#f2a93a]/20 blur-3xl" />
        <div className="animate-float-b absolute top-1/3 -right-28 h-[26rem] w-[26rem] rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float-c absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-[#149aa7]/30 blur-3xl" />
      </div>

      <div className="relative z-10 hidden flex-col justify-center gap-10 px-16 py-10 text-white lg:flex">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10">
          <div className="animate-fade-in-up">
            <div className="text-xs font-semibold tracking-[0.35em] text-white/60">DPL CONSTRUÇÕES</div>
            <h1 className="mt-2 text-4xl leading-tight font-bold">
              Gestão de <span className="text-[#f2a93a]">Pagamento</span>
            </h1>
            <p className="mt-4 text-white/75">
              Sistema de controle de pagamentos simples, seguro e eficiente para sua obra.
            </p>
          </div>

          <div className="animate-fade-in-up grid grid-cols-3 gap-4 [animation-delay:150ms]">
            <Feature icon={<ShieldIcon className="h-5 w-5" />} title="Segurança" desc="Proteção de dados e informações" />
            <Feature icon={<ChartIcon className="h-5 w-5" />} title="Controle" desc="Acompanhe todos os pagamentos" />
            <Feature icon={<DocIcon className="h-5 w-5" />} title="Relatórios" desc="Informações claras para decisões" />
          </div>

          <p className="animate-fade-in-up text-xs text-white/45 [animation-delay:300ms]">
            © {new Date().getFullYear()} DPL Construções. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-6 text-center lg:hidden">
            <div className="text-[11px] font-semibold tracking-[0.35em] text-[#0e7c86]/70">DPL CONSTRUÇÕES</div>
            <div className="text-2xl font-bold text-[#0e7c86]">
              Gestão de <span className="text-[#f2a93a]">Pagamento</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
