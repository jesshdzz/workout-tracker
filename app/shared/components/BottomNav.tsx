// app/shared/components/BottomNav.tsx
import { NavLink } from 'react-router'
import { LayoutDashboard, Dumbbell, TrendingUp, User } from 'lucide-react'

const links = [
  { to: '/app',          label: 'Inicio',    icon: LayoutDashboard },
  { to: '/app/training', label: 'Entreno',   icon: Dumbbell        },
  { to: '/app/progress', label: 'Progreso',  icon: TrendingUp      },
  { to: '/app/profile',  label: 'Perfil',    icon: User            },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface bg-bg">
      <ul className="flex items-center justify-around h-16">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}