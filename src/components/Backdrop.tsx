import { useMemo } from 'react'

/** 지브리풍 따뜻한 연분홍 배경 — 부드러운 빛과 떠다니는 꽃잎 */
export default function Backdrop() {
  const petals = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 7 + Math.random() * 8,
        delay: Math.random() * 18,
        duration: 18 + Math.random() * 14,
        sway: 16 + Math.random() * 26,
        opacity: 0.3 + Math.random() * 0.35,
        warm: i % 3 !== 0,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* 하늘 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #FFE8E6 0%, #FFF0EE 32%, #FFF6F4 64%, #FFFBF8 100%)',
        }}
      />

      {/* 오른쪽 위 따뜻한 햇살 */}
      <div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,246,222,0.95) 0%, rgba(255,226,214,0.5) 45%, rgba(255,226,214,0) 72%)',
        }}
      />

      {/* 왼쪽 아래 은은한 번짐 */}
      <div
        className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,214,216,0.5) 0%, rgba(255,214,216,0) 70%)',
        }}
      />

      {/* 멀리 보이는 언덕 */}
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-32 w-full opacity-45"
      >
        <path d="M0,80 C70,40 130,70 200,52 C270,34 330,62 400,44 L400,120 L0,120 Z" fill="#FFE3E0" />
        <path d="M0,96 C80,66 140,92 210,74 C280,58 340,84 400,68 L400,120 L0,120 Z" fill="#FFEDEA" />
      </svg>

      {/* 떠다니는 꽃잎 */}
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal absolute block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.78,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
            ['--sway' as string]: `${p.sway}px`,
            background: p.warm
              ? 'linear-gradient(135deg,#FFE0E4,#FFC2CC)'
              : 'linear-gradient(135deg,#FFF4D9,#FFE6B8)',
            borderRadius: '70% 30% 65% 35% / 60% 40% 60% 40%',
          }}
        />
      ))}
    </div>
  )
}
