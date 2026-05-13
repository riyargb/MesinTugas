'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login'
      } else {
        setUser(user)
      }
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getInitials = (email: string) => {
    return email?.slice(0, 2).toUpperCase() || 'UT'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">UT</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Mesin Tugas UT</span>
          </div>

          <nav className="flex items-center gap-1">
            <Link href="/generate" className="text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              Generate
            </Link>
            <Link href="/history" className="text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              Riwayat
            </Link>
          </nav>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 h-8 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">
                  {getInitials(user?.email || '')}
                </span>
              </div>
              <span className="text-xs text-slate-700 hidden sm:block max-w-24 truncate">
                {user?.user_metadata?.nama_lengkap || user?.email?.split('@')[0]}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <Toaster richColors position="top-center" />
    </div>
  )
}
