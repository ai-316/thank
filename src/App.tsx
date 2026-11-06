import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Backdrop from './components/Backdrop'
import Calendar, { type ViewMode } from './components/Calendar'
import { backupFileName, fromCsv, saveCsv, toCsv } from './lib/backup'
import {
  addDays,
  addMonths,
  dateKey,
  formatKorean,
  formatShort,
  loadData,
  saveData,
  sameDay,
  startOfMonth,
  startOfWeek,
  streakCount,
  today,
  vibrate,
  type AppData,
} from './lib/store'

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'week', label: '1주일' },
  { key: 'month', label: '1달' },
  { key: 'half', label: '6개월' },
  { key: 'year', label: '1년' },
]

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [mode, setMode] = useState<ViewMode>('month')
  const [anchor, setAnchor] = useState<Date>(() => today())
  const [editing, setEditing] = useState<Date | null>(null)
  const [menu, setMenu] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => saveData(data), [data])

  const flash = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  /* ── 글 저장 ── */
  const saveNote = (d: Date, text: string) => {
    const key = dateKey(d)
    setData((prev) => {
      const notes = { ...prev.notes }
      if (text.trim()) {
        notes[key] = { date: key, text: text.trim(), updatedAt: Date.now() }
      } else {
        delete notes[key]
      }
      return { ...prev, notes }
    })
    setEditing(null)
    vibrate()
    flash(text.trim() ? '오늘의 감사를 담았어요' : '내용을 지웠어요')
  }

  const deleteNote = (d: Date) => {
    const key = dateKey(d)
    setData((prev) => {
      const notes = { ...prev.notes }
      delete notes[key]
      return { ...prev, notes }
    })
    setEditing(null)
    flash('지웠어요')
  }

  /* ── 백업 ── */
  const doExport = async () => {
    if (saving) return
    setSaving(true)
    const result = await saveCsv(backupFileName(), toCsv(data))
    setSaving(false)
    if (result.ok) setMenu(false)
    flash(result.message)
  }

  const doImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const restored = fromCsv(String(reader.result ?? ''))
      if (restored) {
        setData(restored.data)
        setMenu(false)
        flash(`${restored.noteCount}일치를 불러왔어요`)
      } else {
        flash('파일을 읽을 수 없어요. CSV 파일인지 확인해 주세요')
      }
    }
    reader.onerror = () => flash('파일을 열지 못했어요')
    reader.readAsText(file, 'UTF-8')
  }

  /* ── 화면 표시용 ── */
  const written = useMemo(
    () => Object.values(data.notes).filter((n) => n.text?.trim()).length,
    [data.notes],
  )
  const streak = useMemo(() => streakCount(data.notes), [data.notes])

  const headerLabel = useMemo(() => {
    if (mode === 'year') return `${anchor.getFullYear()}년`
    if (mode === 'half') {
      const from = addMonths(anchor, -5)
      return `${from.getFullYear()}년 ${from.getMonth() + 1}월 — ${anchor.getMonth() + 1}월`
    }
    if (mode === 'month') return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`
    const s = startOfWeek(anchor)
    const e = addDays(s, 6)
    return `${s.getMonth() + 1}월 ${s.getDate()}일 — ${e.getMonth() + 1}월 ${e.getDate()}일`
  }, [mode, anchor])

  const shift = (dir: 1 | -1) => {
    if (mode === 'week') setAnchor((a) => addDays(a, dir * 7))
    else if (mode === 'month') setAnchor((a) => addMonths(a, dir))
    else if (mode === 'half') setAnchor((a) => addMonths(a, dir * 6))
    else setAnchor((a) => new Date(a.getFullYear() + dir, a.getMonth(), 1))
  }

  const isNow = useMemo(() => {
    const t = today()
    if (mode === 'year') return anchor.getFullYear() === t.getFullYear()
    if (mode === 'week') return sameDay(startOfWeek(anchor), startOfWeek(t))
    return (
      anchor.getFullYear() === t.getFullYear() && anchor.getMonth() === t.getMonth()
    )
  }, [mode, anchor])

  /* ── 최근 사흘 (오늘 + 어제 + 그제) ── */
  const recentDays = useMemo(() => {
    const t = today()
    return [0, 1, 2].map((i) => addDays(t, -i))
  }, [])

  return (
    <div className="font-body relative min-h-dvh text-stone-700">
      <Backdrop />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-8 pt-9">
        {/* 헤더 */}
        <header className="animate-rise flex items-start justify-between">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-none text-rose-900/90">
              감사 노트
            </h1>
            <p className="mt-2 text-[12px] text-rose-700/60">
              {written > 0 ? `${written}일의 감사` : '오늘의 감사를 적어보세요'}
              {streak > 1 && <span className="ml-1.5 text-rose-500">· {streak}일 연속</span>}
            </p>
          </div>
          <button
            onClick={() => setMenu(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-rose-600 backdrop-blur-sm transition hover:bg-white"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </header>

        {/* 보기 전환 */}
        <div className="animate-rise mt-5 flex gap-1.5" style={{ animationDelay: '60ms' }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => {
                setMode(v.key)
                setAnchor(today())
              }}
              className={`flex-1 rounded-xl py-2 text-[12.5px] font-bold transition ${
                mode === v.key
                  ? 'bg-rose-400 text-white shadow-md shadow-rose-200'
                  : 'bg-white/65 text-rose-600 hover:bg-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* 달력 */}
        <div
          className="animate-rise mt-4 rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: '120ms' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => shift(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 transition hover:bg-rose-50"
            >
              <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.6} />
            </button>
            <button
              onClick={() => setAnchor(today())}
              className="text-[14px] font-bold text-stone-700"
            >
              {headerLabel}
            </button>
            <button
              onClick={() => shift(1)}
              disabled={isNow}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                isNow ? 'text-stone-200' : 'text-rose-400 hover:bg-rose-50'
              }`}
            >
              <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.6} />
            </button>
          </div>

          <Calendar mode={mode} anchor={anchor} notes={data.notes} onPick={setEditing} />
        </div>

        {/* 최근 사흘 — 오늘은 진하게, 어제·그제는 살짝 희미하게 */}
        <div className="animate-rise mt-4 space-y-2" style={{ animationDelay: '180ms' }}>
          {recentDays.map((d, i) => {
            const note = data.notes[dateKey(d)]
            const isToday = i === 0
            return (
              <button
                key={dateKey(d)}
                onClick={() => setEditing(d)}
                className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition ${
                  isToday
                    ? 'bg-white/85 shadow-sm hover:bg-white'
                    : i === 1
                      ? 'bg-white/55 hover:bg-white/80'
                      : 'bg-white/40 hover:bg-white/70'
                }`}
                style={{ opacity: isToday ? 1 : i === 1 ? 0.78 : 0.6 }}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                    isToday ? 'bg-rose-400 text-white' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {isToday ? '오늘' : formatShort(d)}
                </span>
                <span className="flex-1 pt-0.5">
                  {note?.text ? (
                    <span className="line-clamp-2 text-[13.5px] leading-relaxed text-stone-600">
                      {note.text}
                    </span>
                  ) : (
                    <span className="text-[13px] text-stone-400">
                      {isToday ? '오늘의 감사를 적어보세요' : '기록 없음'}
                    </span>
                  )}
                </span>
                <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-300" strokeWidth={2.2} />
              </button>
            )
          })}
        </div>
      </div>

      {/* 글쓰기 화면 */}
      {editing && (
        <NoteEditor
          date={editing}
          initial={data.notes[dateKey(editing)]?.text ?? ''}
          onSave={(text) => saveNote(editing, text)}
          onDelete={() => deleteNote(editing)}
          onClose={() => setEditing(null)}
        />
      )}

      {/* 메뉴 (백업) */}
      {menu && (
        <Sheet title="백업과 복원" onClose={() => setMenu(false)}>
          <p className="mb-4 rounded-xl bg-amber-50/80 p-3 text-[12.5px] leading-relaxed text-amber-800">
            앱을 지우면 기록도 사라집니다. 가끔 백업해서 카톡 나에게 보내기로 보관해 두세요.
          </p>

          <button onClick={doExport} disabled={saving} className="btn-rose w-full">
            <Download className="h-4.5 w-4.5" strokeWidth={2.4} />
            {saving ? '저장하는 중…' : '엑셀 파일(CSV)로 내보내기'}
          </button>

          <label className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[14px] font-bold text-stone-600 shadow-sm transition hover:bg-stone-50">
            <Upload className="h-4.5 w-4.5 text-rose-500" strokeWidth={2.4} />
            CSV 파일 불러오기
            <input
              type="file"
              accept=".csv,text/csv,text/comma-separated-values,application/vnd.ms-excel,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) doImport(f)
                e.target.value = ''
              }}
            />
          </label>

          <div className="mt-4 rounded-xl bg-rose-50/70 p-3.5">
            <p className="mb-1.5 text-[12px] font-bold text-rose-800">엑셀에서 편집하는 방법</p>
            <ul className="space-y-1 text-[11.5px] leading-relaxed text-rose-700/90">
              <li>· 저장되는 곳: <strong>내 파일 &gt; Documents</strong></li>
              <li>· 엑셀로 열면 3칸으로 보입니다</li>
              <li>· 날짜 / 요일 / 감사한 내용</li>
              <li>· 줄을 추가하면 그 날짜에 기록이 생깁니다</li>
              <li>· 수정한 파일을 다시 불러오면 반영돼요</li>
            </ul>
          </div>

          <p className="mt-3 text-center text-[11.5px] text-stone-400">
            지금 {written}일치가 담겨 있어요
          </p>
        </Sheet>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="toast-in pointer-events-none fixed inset-x-0 bottom-10 z-[60] flex justify-center px-6">
          <div className="rounded-full bg-stone-800/90 px-5 py-2.5 text-[13px] font-semibold text-white shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── 바텀시트 틀 ───────── */
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="sheet-up w-full max-w-[430px] rounded-t-[28px] bg-white px-6 pb-8 pt-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-stone-800">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ───────── 글쓰기 ───────── */
function NoteEditor({
  date,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  date: Date
  initial: string
  onSave: (text: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [text, setText] = useState(initial)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  const changed = text.trim() !== initial.trim()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#FFF6F4] to-[#FFFBF8]">
      {/* 상단 */}
      <div className="flex items-center justify-between px-5 pb-3 pt-6">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-stone-500 shadow-sm"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.4} />
        </button>
        <p className="text-[13.5px] font-bold text-rose-800/90">{formatKorean(date)}</p>
        {initial ? (
          <button
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-rose-400 shadow-sm"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
          </button>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      {/* 종이 */}
      <div className="flex-1 px-5 pb-4">
        <div className="relative h-full overflow-hidden rounded-3xl bg-white/85 shadow-sm">
          {/* 위쪽 장식 */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-200 via-orange-100 to-rose-200" />
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'오늘 감사한 일,\n마음에 남은 깨달음을 편하게 적어보세요.'}
            className="note-paper h-[calc(100%-6px)] w-full resize-none bg-transparent px-6 py-5 text-[15px] leading-[2] text-stone-700 outline-none placeholder:text-stone-300"
          />
        </div>
      </div>

      {/* 저장 */}
      <div className="px-5 pb-7">
        <button
          onClick={() => onSave(text)}
          disabled={!changed}
          className={`btn-rose w-full ${!changed ? 'opacity-40' : ''}`}
        >
          {initial ? '수정하기' : '담아두기'}
        </button>
        <p className="mt-2.5 text-center text-[11px] text-stone-400">
          {text.trim().length > 0 ? `${text.trim().length}자` : '한 줄이어도 충분해요'}
        </p>
      </div>
    </div>
  )
}
