import type { ReactNode } from 'react'

// TODO: once the real brand assets are available, replace this gradient with
// the construction-site photo (e.g. import heroPhoto from '../assets/dpl-hero.jpg'
// and set it as a background-image on the wrapper below).
const HERO_GRADIENT =
  'bg-[linear-gradient(135deg,#0b1b32_0%,#13294b_45%,#3a2a1f_85%,#5c3a17_100%)]'

function DplMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="26" width="8" height="20" rx="1.5" fill="#f2a93a" />
      <rect x="13" y="16" width="8" height="30" rx="1.5" fill="#f2a93a" />
      <rect x="24" y="6" width="8" height="40" rx="1.5" fill="#f2a93a" />
      <path d="M35 46V18l11-8v36z" fill="#13294b" />
    </svg>
  )
}

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
      <div className="pointer-events-none absolute inset-0 bg-black/25" />

      <div className="relative z-10 hidden flex-col justify-center gap-10 px-16 py-10 text-white lg:flex">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10">
          <div className="flex items-center gap-3">
            <DplMark className="h-12 w-12 shrink-0" />
            <div>
              <div className="text-3xl leading-none font-extrabold">DPL</div>
              <div className="text-xs tracking-[0.35em] text-white/80">CONSTRUÇÕES</div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl leading-tight font-bold">
              Gestão que constrói <span className="text-[#f2a93a]">resultados.</span>
            </h1>
            <p className="mt-4 text-white/75">
              Sistema de controle de pagamentos simples, seguro e eficiente para sua obra.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Feature icon={<ShieldIcon className="h-5 w-5" />} title="Segurança" desc="Proteção de dados e informações" />
            <Feature icon={<ChartIcon className="h-5 w-5" />} title="Controle" desc="Acompanhe todos os pagamentos" />
            <Feature icon={<DocIcon className="h-5 w-5" />} title="Relatórios" desc="Informações claras para decisões" />
          </div>

          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} DPL Construções. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f4f6f9]">
              <DplMark className="h-9 w-9" />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
