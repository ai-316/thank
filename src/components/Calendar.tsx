import { useMemo } from 'react'
import {
  WEEKDAYS,
  addDays,
  addMonths,
  dateKey,
  daysAgo,
  sameDay,
  startOfMonth,
  startOfWeek,
  today,
  type Note,
} from '../lib/store'

export type ViewMode = 'week' | 'month' | 'half' | 'year'

interface Props {
  mode: ViewMode
  anchor: Date
  notes: Record<string, Note>
  onPick: (d: Date) => void
}

/** 하루 칸 하나 */
function Cell({
  d,
  notes,
  onPick,
  size,
  dimOutside,
  anchorMonth,
}: {
  d: Date
  notes: Record<string, Note>
  onPick: (d: Date) => void
  size: 'lg' | 'md' | 'sm'
  dimOutside?: boolean
  anchorMonth?: number
}) {
  const key = dateKey(d)
  const has = !!notes[key]?.text?.trim()
  const isToday = sameDay(d, today())
  const ago = daysAgo(d)
  const future = ago < 0
  const outside = dimOutside && anchorMonth !== undefined && d.getMonth() !== anchorMonth

  // 오늘 기준 최근 2일은 살짝 진하게, 나머지는 은은하게
  const recent = ago >= 1 && ago <= 2

  const box =
    size === 'lg'
      ? 'h-[52px] text-[15px]'
      : size === 'md'
        ? 'h-[38px] text-[12.5px]'
        : 'h-[22px] text-[9px]'

  return (
    <button
      onClick={() => onPick(d)}
      disabled={future}
      className={`relative flex ${box} w-full flex-col items-center justify-center rounded-xl transition-all ${
        future
          ? 'cursor-default opacity-25'
          : isToday
            ? 'bg-gradient-to-b from-rose-300 to-rose-400 font-bold text-white shadow-md shadow-rose-200'
            : has
              ? 'bg-rose-100/90 font-semibold text-rose-700 hover:bg-rose-200/80'
              : recent
                ? 'bg-white/70 text-stone-500 hover:bg-white'
                : outside
                  ? 'text-stone-300 hover:bg-white/50'
                  : 'text-stone-400 hover:bg-white/60'
      }`}
    >
      <span className="leading-none">{d.getDate()}</span>
      {has && !isToday && size !== 'sm' && (
        <span className="mt-1 h-1 w-1 rounded-full bg-rose-400" />
      )}
      {has && isToday && size !== 'sm' && (
        <span className="mt-1 h-1 w-1 rounded-full bg-white/90" />
      )}
      {has && size === 'sm' && (
        <span className="absolute bottom-0.5 h-[3px] w-[3px] rounded-full bg-rose-400" />
      )}
    </button>
  )
}

/** 한 달짜리 격자 */
function MonthGrid({
  month,
  notes,
  onPick,
  size,
  showTitle,
}: {
  month: Date
  notes: Record<string, Note>
  onPick: (d: Date) => void
  size: 'lg' | 'md' | 'sm'
  showTitle?: boolean
}) {
  const first = startOfMonth(month)
  const start = startOfWeek(first)
  const cells = useMemo(() => {
    const arr: Date[] = []
    for (let i = 0; i < 42; i++) arr.push(addDays(start, i))
    // 마지막 주가 통째로 다음 달이면 뺍니다
    while (arr.length > 28 && arr[arr.length - 7].getMonth() !== month.getMonth()) {
      arr.splice(-7)
    }
    return arr
  }, [start, month])

  return (
    <div>
      {showTitle && (
        <p className="mb-1.5 text-center text-[11.5px] font-bold text-rose-500">
          {month.getMonth() + 1}월
        </p>
      )}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`text-center ${size === 'sm' ? 'text-[8px]' : 'text-[10.5px]'} font-semibold ${
              i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-stone-400'
            }`}
          >
            {size === 'sm' ? w : w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d) => (
          <Cell
            key={dateKey(d)}
            d={d}
            notes={notes}
            onPick={onPick}
            size={size}
            dimOutside
            anchorMonth={month.getMonth()}
          />
        ))}
      </div>
    </div>
  )
}

export default function Calendar({ mode, anchor, notes, onPick }: Props) {
  /* 1주일 */
  if (mode === 'week') {
    const start = startOfWeek(anchor)
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    return (
      <div>
        <div className="mb-1.5 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`text-center text-[11px] font-semibold ${
                i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-stone-400'
              }`}
            >
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => (
            <Cell key={dateKey(d)} d={d} notes={notes} onPick={onPick} size="lg" />
          ))}
        </div>
      </div>
    )
  }

  /* 1달 */
  if (mode === 'month') {
    return <MonthGrid month={anchor} notes={notes} onPick={onPick} size="md" />
  }

  /* 6개월 */
  if (mode === 'half') {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(startOfMonth(anchor), i - 5))
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {months.map((m) => (
          <MonthGrid
            key={`${m.getFullYear()}-${m.getMonth()}`}
            month={m}
            notes={notes}
            onPick={onPick}
            size="sm"
            showTitle
          />
        ))}
      </div>
    )
  }

  /* 1년 */
  const months = Array.from({ length: 12 }, (_, i) => new Date(anchor.getFullYear(), i, 1))
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-3.5">
      {months.map((m) => (
        <MonthGrid
          key={m.getMonth()}
          month={m}
          notes={notes}
          onPick={onPick}
          size="sm"
          showTitle
        />
      ))}
    </div>
  )
}
