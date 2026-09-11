import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoDpl from '../assets/images/logo-dpl.png'

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3.5h7l4 4V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6M9 8h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 6.5h11v9h-11z M13.5 10h4l3 3v2.5h-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="18" r="1.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 19c1-3.3 3.5-5 6-5s5 1.7 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 4.8a3.2 3.2 0 010 6.4M17.5 14c2 .4 3.6 1.9 4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/notas-fiscais', label: 'Notas Fiscais', icon: InvoiceIcon, end: false },
  { to: '/fornecedores', label: 'Fornecedores', icon: TruckIcon, end: false },
  { to: '/programacao', label: 'Programação', icon: CalendarIcon, end: false },
] as const

const ADMIN_NAV_ITEM = { to: '/usuarios', label: 'Usuários', icon: UsersIcon, end: false } as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const items = user?.role === 'adm' ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  return (
    <>
      <div className="flex items-center px-6 py-6">
        <img src={logoDpl} alt="DPL Construções" className="h-11 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-[#0e7c86]/10 text-[#0e7c86]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#0e7c86]'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0e7c86] hover:bg-gray-100 lg:hidden"
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <div className="text-right text-sm">
            <div className="font-medium text-[#0e7c86]">{user.username}</div>
            <div className="text-xs text-gray-500">
              {user.regional} / {user.seccional}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-[#0e7c86] hover:bg-gray-50"
        >
          Sair
        </button>
      </div>
    </header>
  )
}

export default function AppLayout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-gray-50">
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-svh flex-1 flex-col">
        <TopBar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
