'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success('Link reset password sudah dikirim ke email')
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
            <CardTitle className="text-lg text-slate-900">Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email terdaftar untuk menerima link reset password
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 text-sm font-medium">Email terkirim</p>
                <p className="text-green-700 text-sm mt-1">
                  Cek inbox atau folder spam untuk link reset password
                </p>
              </div>
              <div className="text-center">
                <Link href="/login" className="text-blue-900 hover:underline text-sm font-medium">
                  Kembali ke halaman login
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                  disabled={loading}
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </Button>
                <p className="text-sm text-slate-500 text-center">
                  Ingat password?{' '}
                  <Link href="/login" className="text-blue-900 hover:underline font-medium">
                    Kembali login
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
