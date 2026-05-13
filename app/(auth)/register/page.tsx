'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Password tidak cocok')
      return
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama_lengkap: nama }
      }
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Registrasi berhasil! Cek email untuk verifikasi.')
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900 mb-4">
            <span className="text-white font-bold text-xl">UT</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mesin Tugas UT</h1>
          <p className="text-slate-500 text-sm mt-1">Asisten akademik Universitas Terbuka</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-900">Buat akun baru</CardTitle>
            <CardDescription>Isi data diri untuk mendaftar</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-slate-700">Nama Lengkap</Label>
                <Input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-slate-700">Konfirmasi Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="border-slate-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Daftar'}
              </Button>
              <p className="text-sm text-slate-500 text-center">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-blue-900 hover:underline font-medium">
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
