'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getInitials = (email: string) => {
    return email?.slice(0, 2).toUpperCase() || 'UT'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
              <span className="text-white font-bold text-xs">UT</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm hidden sm:block">
              Mesin Tugas UT
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <Link href="/generate">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 text-sm">
                Generate
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 text-sm">
                Riwayat
              </Button>
            </Link>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 pl-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-blue-900 text-white text-xs">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700 hidden sm:block max-w-32 truncate">
                  {user?.user_metadata?.nama_lengkap || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal truncate">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}
