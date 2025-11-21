'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, LayoutDashboard, Shield, Briefcase, ChevronDown, Home as HomeIcon, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/auth'

const navigation = [
  { name: 'Buy', href: '/buy' },
  { name: 'Rent', href: '/rent' },
  { name: 'Sell', href: '/sell' },
]

export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        setUser(profile)
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          <div className="flex items-center flex-1">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <HomeIcon className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">RealEstate</span>
            </Link>
          </div>
          
          <div className="hidden md:flex md:space-x-2 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-900 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-2 flex-1 justify-end">
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <>
                <Link href="/favourites">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 hover:bg-blue-600 hover:text-white"
                    title="Favourites"
                  >
                    <Heart className={`h-5 w-5 ${pathname === '/favourites' ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} alt={user.full_name || 'User'} />
                        <AvatarFallback>
                          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">My Account</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/user-dashboard" className="flex items-center w-full cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      User Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {['agent', 'admin'].includes(user.role) && (
                    <DropdownMenuItem asChild>
                      <Link href="/agent" className="flex items-center w-full cursor-pointer">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Agent Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-2 mt-8">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/' && pathname?.startsWith(item.href))
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <>
                        <div className="px-4 py-2 mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || ''} alt={user.full_name || 'User'} />
                              <AvatarFallback>
                                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || 'User'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/favourites"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors ${
                            pathname === '/favourites'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-5 h-5 mr-3 ${pathname === '/favourites' ? 'fill-white text-white' : ''}`} />
                          Favourites
                        </Link>
                        <Link
                          href="/user-dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                          <LayoutDashboard className="w-5 h-5 mr-3" />
                          User Dashboard
                        </Link>
                        {['agent', 'admin'].includes(user.role) && (
                          <Link
                            href="/agent"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            <Briefcase className="w-5 h-5 mr-3" />
                            Agent Dashboard
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            <Shield className="w-5 h-5 mr-3" />
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100 rounded-md"
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-base font-medium text-primary hover:bg-gray-100 rounded-md"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

