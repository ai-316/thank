/**
 * 감사 노트 — 데이터 저장
 *
 * 쓴 글은 모두 폰 안에 저장됩니다.
 * 날짜(YYYY-MM-DD)를 열쇠로 하루에 한 장씩 기록합니다.
 */

export interface Note {
  /** 'YYYY-MM-DD' */
  date: string
  text: string
  /** 마지막으로 고친 시각 */
  updatedAt: number
}

export interface AppData {
  version: number
  notes: Record<string, Note>
}

const KEY = 'thanks-note:v1'

export const EMPTY_DATA: AppData = { version: 1, notes: {} }

/* ───────── 날짜 도우미 ───────── */

export function dateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function today(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function addMonths(d: Date, n: number): Date {
  const c = new Date(d)
  c.setMonth(c.getMonth() + n)
  return c
}

export function sameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b)
}

/** 그 달의 1일 */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** 그 주의 일요일 */
export function startOfWeek(d: Date): Date {
  const c = new Date(d)
  c.setDate(c.getDate() - c.getDay())
  return c
}

/** 오늘로부터 며칠 전인지 (미래면 음수) */
export function daysAgo(d: Date): number {
  return Math.round((today().getTime() - d.getTime()) / 86400000)
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatKorean(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`
}

export function formatShort(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

/* ───────── 저장 / 불러오기 ───────── */

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw)
    return {
      version: 1,
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    }
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* 저장 공간 부족 */
  }
}

export function vibrate(ms = 12) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* noop */
  }
}

/** 연속으로 쓴 날수 (오늘 또는 어제부터 거슬러) */
export function streakCount(notes: Record<string, Note>): number {
  let n = 0
  let cur = today()
  // 오늘 안 썼으면 어제부터 셉니다
  if (!notes[dateKey(cur)]?.text?.trim()) {
    cur = addDays(cur, -1)
  }
  while (notes[dateKey(cur)]?.text?.trim()) {
    n++
    cur = addDays(cur, -1)
  }
  return n
}
