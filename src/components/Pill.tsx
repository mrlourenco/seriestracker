import type { ReactNode } from 'react'

interface Props {
  active: boolean
  onClick: () => void
  children: ReactNode
  /** Background when active; defaults to the app's red accent */
  activeBg?: string
  size?: 'sm' | 'md'
}

// Rounded filter chip used in horizontal scroll rows (status, platform, genre…)
export default function Pill({ active, onClick, children, activeBg = '#E11D2A', size = 'md' }: Props) {
  const sm = size === 'sm'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flexShrink: 0,
        background: active ? activeBg : '#16161b',
        color: active ? '#fff' : '#b4b4bd',
        font: `600 ${sm ? 12 : 13}px 'Hanken Grotesk'`,
        padding: sm ? '6px 13px' : '7px 14px',
        borderRadius: 999,
        border: active ? 'none' : '1px solid #26262e',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
