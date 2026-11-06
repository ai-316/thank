/**
 * 감사 노트 — 백업 / 복원 (CSV)
 *
 * 엑셀이나 워드에서 바로 열어 고칠 수 있는 CSV 형식입니다.
 * 고친 파일을 다시 불러오면 그대로 반영됩니다.
 *
 * CSV 열 구성: 날짜 | 요일 | 감사한 내용
 */

import type { AppData, Note } from './store'
import { WEEKDAYS, dateKey, parseKey, today } from './store'

/* ───────── CSV 만들기 ───────── */

function cell(v: string): string {
  const s = String(v ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export const CSV_HEADER = ['날짜', '요일', '감사한 내용']

export function toCsv(data: AppData): string {
  const rows: string[] = [CSV_HEADER.join(',')]

  // 날짜 순서대로 (최근 것이 위로)
  const keys = Object.keys(data.notes)
    .filter((k) => data.notes[k]?.text?.trim())
    .sort((a, b) => b.localeCompare(a))

  for (const k of keys) {
    const n = data.notes[k]
    let weekday = ''
    try {
      weekday = WEEKDAYS[parseKey(k).getDay()]
    } catch {
      weekday = ''
    }
    rows.push([cell(k), cell(weekday), cell(n.text)].join(','))
  }

  // 엑셀에서 한글이 깨지지 않도록 맨 앞에 BOM
  return '\uFEFF' + rows.join('\r\n')
}

/* ───────── CSV 읽기 ───────── */

function parseLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuote = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuote = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function splitRows(text: string): string[] {
  const rows: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuote = !inQuote
      cur += ch
    } else if (!inQuote && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (cur.trim()) rows.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) rows.push(cur)
  return rows
}

/** 여러 가지 날짜 표기를 'YYYY-MM-DD'로 맞춥니다 */
function normalizeDate(raw: string): string | null {
  const s = (raw ?? '').trim()
  if (!s) return null

  // 2026-03-05 / 2026.3.5 / 2026/3/5
  let m = s.match(/^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/)
  if (m) {
    const y = m[1]
    const mo = m[2].padStart(2, '0')
    const d = m[3].padStart(2, '0')
    return `${y}-${mo}-${d}`
  }

  // 20260305
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  return null
}

export interface ImportResult {
  data: AppData
  noteCount: number
}

export function fromCsv(raw: string): ImportResult | null {
  try {
    const text = raw.replace(/^\uFEFF/, '')
    const rows = splitRows(text)
    if (rows.length === 0) return null

    const first = parseLine(rows[0]).map((c) => c.trim())
    const hasHeader =
      first[0]?.includes('날짜') || first[0]?.toLowerCase().includes('date')
    const body = hasHeader ? rows.slice(1) : rows

    if (!hasHeader) {
      const looksLikeTable = rows.some((r) => parseLine(r).length >= 2)
      if (!looksLikeTable) return null
    }

    const notes: Record<string, Note> = {}
    let count = 0

    for (const row of body) {
      const cols = parseLine(row)
      const key = normalizeDate(cols[0] ?? '')
      if (!key) continue

      // 요일 칸이 있을 수도, 없을 수도 있습니다
      let text = (cols[2] ?? '').trim()
      if (!text && cols.length === 2) text = (cols[1] ?? '').trim()
      if (!text) continue

      notes[key] = { date: key, text, updatedAt: Date.now() }
      count++
    }

    if (count === 0) return null
    return { data: { version: 1, notes }, noteCount: count }
  } catch {
    return null
  }
}

/* ───────── 파일 저장 / 공유 ───────── */

function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
}

export interface SaveResult {
  ok: boolean
  message: string
}

export async function saveCsv(filename: string, csv: string): Promise<SaveResult> {
  if (!isNative()) {
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      return { ok: true, message: '백업 파일을 내려받았어요' }
    } catch {
      return { ok: false, message: '저장하지 못했어요' }
    }
  }

  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')

    await Filesystem.writeFile({
      path: filename,
      data: csv,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })

    const uriResult = await Filesystem.getUri({
      path: filename,
      directory: Directory.Documents,
    })

    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: '감사 노트 백업',
        text: '감사 노트 백업 파일입니다',
        url: uriResult.uri,
        dialogTitle: '백업 파일 보내기',
      })
      return { ok: true, message: '문서 폴더에 저장했어요' }
    } catch {
      return { ok: true, message: '내 파일 > Documents 에 저장했어요' }
    }
  } catch {
    return { ok: false, message: '저장 권한을 확인해 주세요' }
  }
}

export function backupFileName(): string {
  return `감사노트_${dateKey(today())}.csv`
}
