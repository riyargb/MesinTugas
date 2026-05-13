'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
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
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password berhasil diubah')
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
            <CardTitle className="text-lg text-slate-900">Reset Password</CardTitle>
            <CardDescription>Masukkan password baru untuk akun kamu</CardDescription>
          </CardHeader>
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password Baru</Label>
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
                  placeholder="Ulangi password baru"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="border-slate-200"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
