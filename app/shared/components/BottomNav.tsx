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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border">
      <ul className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} />
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
