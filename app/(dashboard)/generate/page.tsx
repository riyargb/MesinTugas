'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const MATA_KULIAH = [
  { kode: 'MSIM4202', nama: 'Struktur Data' },
  { kode: 'STSI4105', nama: 'Basis Data' },
  { kode: 'MKKI4201', nama: 'Pengantar Statistika' },
  { kode: 'STMA4113', nama: 'Aljabar Linear Elementer' },
  { kode: 'MKWN4108', nama: 'Bahasa Indonesia' },
  { kode: 'MKDI4201', nama: 'Bahasa Inggris' },
  { kode: 'MKWN4110', nama: 'Pancasila' },
  { kode: 'Lainnya', nama: 'Lainnya (ketik manual)' },
]

const FAKULTAS = ['FHISIP', 'FKIP', 'FEKON', 'FST']

const UPBJJ = [
  'Jakarta Barat', 'Jakarta Timur', 'Jakarta Selatan',
  'Jakarta Utara', 'Bandung', 'Surabaya', 'Medan',
  'Makassar', 'Yogyakarta', 'Semarang', 'Malang', 'Lainnya',
]

async function extractPdfText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const doExtract = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((s: any) => s.str).join(' ') + '\n'
        }
        resolve(text.trim())
      } catch (e) {
        reject(e)
      }
    }
    if ((window as any).pdfjsLib) {
      doExtract()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => doExtract()
      script.onerror = () => reject(new Error('Gagal load PDF.js'))
      document.head.appendChild(script)
    }
  })
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractXlsxText(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  let text = ''
  workbook.SheetNames.forEach((sheetName: string) => {
    const sheet = workbook.Sheets[sheetName]
    text += XLSX.utils.sheet_to_csv(sheet) + '\n'
  })
  return text.trim()
}

async function extractImageText(file: File): Promise<string> {
  const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY || ''
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      const mime = file.type
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
                { type: 'text', text: 'Baca dan tulis ulang semua teks/soal yang ada di gambar ini secara lengkap dan akurat.' }
              ]
            }]
          })
        })
        const data = await res.json()
        resolve(data.choices?.[0]?.message?.content || '')
      } catch {
        resolve('[Gagal baca gambar]')
      }
    }
    reader.readAsDataURL(file)
  })
}

async function extractFileContent(file: File): Promise<string> {
  const type = file.type
  if (type === 'application/pdf') return extractPdfText(file)
  if (type === 'text/plain' || type === 'text/csv') return file.text()
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return extractDocxText(file)
  if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return extractXlsxText(file)
  return ''
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [fakultas, setFakultas] = useState<string>('')
  const [upbjj, setUpbjj] = useState<string>('')
  const [kodeMatkul, setKodeMatkul] = useState<string>('')
  const [namaMatkul, setNamaMatkul] = useState<string>('')
  const [nomorTugas, setNomorTugas] = useState<string>('1')
  const [format, setFormat] = useState<string>('pdf')
  const [withExplanation, setWithExplanation] = useState(true)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isImage, setIsImage] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const namaRef = useRef<HTMLInputElement>(null)
  const nimRef = useRef<HTMLInputElement>(null)
  const prodiRef = useRef<HTMLInputElement>(null)
  const kodeKelasRef = useRef<HTMLInputElement>(null)
  const soalRef = useRef<HTMLTextAreaElement>(null)
  const telegramRef = useRef<HTMLInputElement>(null)
  const matkulCustomRef = useRef<HTMLInputElement>(null)

  const handleMatkulChange = (value: string) => {
    const selected = MATA_KULIAH.find(m => m.kode === value)
    if (selected) {
      setKodeMatkul(selected.kode)
      setNamaMatkul(selected.nama)
    }
  }

  const handleFile = async (file: File) => {
    const allowed = [
      'application/pdf', 'image/png', 'image/jpeg',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!allowed.includes(file.type)) {
      toast.error('Format tidak didukung')
      return
    }
    setUploadedFile(file)
    setExtractedText('')
    setIsImage(file.type.startsWith('image/'))
    if (!file.type.startsWith('image/')) {
      setExtracting(true)
      toast.info('Membaca isi file...')
      try {
        const text = await extractFileContent(file)
        setExtractedText(text)
        toast.success('File dibaca! ' + text.length + ' karakter')
      } catch {
        toast.error('Gagal baca file. Tulis soal manual.')
      } finally {
        setExtracting(false)
      }
    } else {
      toast.success('Gambar dipilih')
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    const nama = namaRef.current?.value || ''
    const nim = nimRef.current?.value || ''
    const prodi = prodiRef.current?.value || ''
    const kodeKelas = kodeKelasRef.current?.value || ''
    const soalManual = soalRef.current?.value || ''
    const telegramId = telegramRef.current?.value || ''
    const matkulCustom = matkulCustomRef.current?.value || ''

    if (!uploadedFile && !soalManual.trim()) {
      toast.error('Upload file soal atau tulis soal manual')
      return
    }
    if (!kodeMatkul) { toast.error('Pilih mata kuliah'); return }
    if (!nama || !nim || !prodi || !fakultas || !upbjj || !kodeKelas) {
      toast.error('Lengkapi identitas mahasiswa')
      return
    }

    setLoading(true)
    toast.info('Sedang memproses tugas...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const effectiveKode = kodeMatkul === 'Lainnya' ? matkulCustom.split('|')[0]?.trim() : kodeMatkul
      const effectiveNama = kodeMatkul === 'Lainnya' ? matkulCustom.split('|')[1]?.trim() || matkulCustom : namaMatkul

      let soalFinal = soalManual
      if (uploadedFile) {
        if (isImage) {
          toast.info('Membaca gambar soal...')
          const imageText = await extractImageText(uploadedFile)
          soalFinal = imageText + (soalManual ? '\n\n' + soalManual : '')
        } else if (extractedText) {
          soalFinal = extractedText + (soalManual ? '\n\nCatatan: ' + soalManual : '')
        }
      }

      if (!soalFinal.trim()) {
        toast.error('Soal tidak berhasil diekstrak. Tulis manual.')
        setLoading(false)
        return
      }

      const payload = {
        nama, nim, prodi, fakultas, upbjj,
        kode_matkul: effectiveKode,
        nama_matkul: effectiveNama,
        kode_kelas: kodeKelas,
        nomor_tugas: parseInt(nomorTugas),
        soal: soalFinal,
        format,
        with_explanation: withExplanation,
        telegram_id: telegramId || null,
      }

      const res = await fetch(`${API_URL}/generate/tugas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Gagal')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Tugas_${nim}_${nomorTugas}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Tugas berhasil digenerate!')
    } catch {
      toast.error('Gagal generate tugas. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <form onSubmit={handleGenerate}>
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-base font-semibold text-slate-900">Generate Tugas</h1>
          <p className="text-xs text-slate-500">Isi form untuk menghasilkan jawaban tugas otomatis</p>
        </div>

        <div className="mx-4 mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identitas Mahasiswa</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Nama Lengkap</p>
                <input ref={namaRef} type="text" placeholder="Nama" required className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">NIM</p>
                <input ref={nimRef} type="text" placeholder="0531XXXXXXX" required className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Program Studi</p>
                <input ref={prodiRef} type="text" placeholder="Sistem Informasi" required className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Fakultas</p>
                <Select onValueChange={(v: string) => setFakultas(v ?? "")}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAKULTAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">UPBJJ/UT Daerah</p>
                <Select onValueChange={(v: string) => setUpbjj(v ?? "")}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {UPBJJ.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Kode Kelas</p>
                <input ref={kodeKelasRef} type="text" placeholder="42" required className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detail Tugas</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Mata Kuliah</p>
                <Select onValueChange={(v: string) => handleMatkulChange(v ?? "")}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATA_KULIAH.map(m => <SelectItem key={m.kode} value={m.kode}>{m.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
                {kodeMatkul === 'Lainnya' && (
                  <input ref={matkulCustomRef} type="text" placeholder="KODE | Nama Matkul" className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white mt-2" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">Nomor Tugas</p>
                <Select defaultValue="1" onValueChange={(v: string) => setNomorTugas(v ?? "")}>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tugas 1</SelectItem>
                    <SelectItem value="2">Tugas 2</SelectItem>
                    <SelectItem value="3">Tugas 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Format Output</p>
              <Select defaultValue="pdf" onValueChange={(v: string) => setFormat(v ?? "")}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word (DOCX)</SelectItem>
                  <SelectItem value="txt">Text (TXT)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Upload File Soal</p>
              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  <p className="text-sm font-medium text-slate-600">Klik atau drag file ke sini</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, TXT, CSV, DOCX, XLSX</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-sm text-slate-700 truncate font-medium">{uploadedFile.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" onClick={() => { setUploadedFile(null); setExtractedText('') }} className="text-red-500 text-xs ml-2 shrink-0">Hapus</button>
                  </div>
                  {extracting && (
                    <div className="px-3 py-2 text-xs text-slate-500 bg-white">Membaca isi file...</div>
                  )}
                  {extractedText && !extracting && (
                    <div className="px-3 py-2 bg-green-50">
                      <p className="text-xs text-green-700 font-medium">Berhasil dibaca: {extractedText.length} karakter</p>
                      <p className="text-xs text-green-600 mt-0.5 line-clamp-2">{extractedText.slice(0, 120)}...</p>
                    </div>
                  )}
                  {isImage && !extracting && (
                    <div className="px-3 py-2 bg-amber-50">
                      <p className="text-xs text-amber-700">Gambar akan dibaca AI saat generate</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Tulis Soal Manual <span className="text-slate-400 font-normal">(opsional)</span></p>
              <textarea ref={soalRef} placeholder="Ketik soal tambahan atau jika tidak upload file..." rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white resize-none" />
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengaturan</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Penjelasan Detail</p>
                <p className="text-xs text-slate-400 mt-0.5">Jawaban lengkap step by step</p>
              </div>
              <button
                type="button"
                onClick={() => setWithExplanation(!withExplanation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${withExplanation ? 'bg-blue-900' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${withExplanation ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">ID Telegram <span className="text-slate-400 font-normal">(opsional)</span></p>
              <input ref={telegramRef} type="text" placeholder="Contoh: 123456789" className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white font-mono" />
              <p className="text-xs text-slate-400 mt-1">Kosongkan jika tidak ingin dikirim ke Telegram</p>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 pb-8">
          <button
            type="submit"
            disabled={loading || extracting}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white h-11 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? 'Sedang memproses...' : extracting ? 'Membaca file...' : 'Generate Tugas'}
          </button>
        </div>
      </form>
    </div>
  )
}
