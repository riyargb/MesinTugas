'use client'

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Riwayat Tugas</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar tugas yang pernah digenerate</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-500 text-sm">Belum ada riwayat tugas</p>
        <p className="text-slate-400 text-xs mt-1">Tugas yang sudah digenerate akan muncul di sini</p>
      </div>
    </div>
  )
}
