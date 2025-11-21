'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Building, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
  tab?: string
  view?: string
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    view: 'dashboard',
  },
  {
    name: 'All Properties',
    href: '/admin',
    icon: Building2,
    view: 'all-properties',
  },
  {
    name: 'Real Estate Companies',
    href: '/admin',
    icon: Building2,
    view: 'real-estate-companies',
  },
]

interface AdminSidebarProps {
  activeTab?: string
  activeView?: string
  onTabChange?: (tab: string) => void
  onViewChange?: (view: string) => void
}

export function AdminSidebar({ activeTab, activeView, onTabChange, onViewChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.view && onViewChange) {
      onViewChange(item.view)
    } else if (item.tab && onTabChange) {
      onTabChange(item.tab)
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
            {isExpanded ? 'Admin Menu' : ''}
          </h2>
        </div>
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.view 
                ? activeView === item.view 
                : item.tab 
                  ? activeTab === item.tab 
                  : pathname === item.href

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

