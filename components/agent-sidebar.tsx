'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ChevronRight, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
  view?: string // 'dashboard', 'my-properties', 'settings'
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/agent-dashboard',
    icon: LayoutDashboard,
    view: 'dashboard',
  },
  {
    name: 'My Properties',
    href: '/agent-dashboard',
    icon: Building2,
    view: 'my-properties',
  },
  {
    name: 'Settings',
    href: '/agent-dashboard',
    icon: Settings,
    view: 'settings',
  },
]

interface AgentSidebarProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function AgentSidebar({ activeView, onViewChange }: AgentSidebarProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.view && onViewChange) {
      onViewChange(item.view)
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-40',
        isExpanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2
            className={cn(
              'font-semibold text-gray-700 transition-opacity duration-300',
              isExpanded ? 'opacity-100' : 'opacity-0'
            )}
          >
            {isExpanded ? 'Agent Menu' : ''}
          </h2>
        </div>
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.view ? activeView === item.view : pathname === item.href

              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span
                      className={cn(
                        'transition-opacity duration-300 whitespace-nowrap',
                        isExpanded ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      {item.name}
                    </span>
                    {isActive && isExpanded && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

