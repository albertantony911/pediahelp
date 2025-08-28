// /Users/albert/Desktop/github_repos/pediahelp/sanity/components/OverridesInput.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { set } from 'sanity'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import SlotGrid from './SlotGrid'
import { SLOT_OPTIONS } from '../schemas/objects/weeklyAvailability'

type OverrideItem = {
  _type: 'appointmentOverride'
  _key?: string
  date: string       // yyyy-MM-dd
  isFullDay: boolean
  partialSlots?: string[]
}

/* ---------------- utils ---------------- */
const genKey = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID()
    : `k_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`

const withKey = (o: OverrideItem): OverrideItem => (o._key ? o : { ...o, _key: genKey() })

const ymdOf = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

const isTodayOrFuture = (s: string) => {
  try {
    const dt = parseYMD(s)
    const today = new Date()
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
    return x.getTime() >= t.getTime()
  } catch { return false }
}

function monthShort(d: Date) {
  return d.toLocaleString(undefined, { month: 'short' }).toUpperCase()
}

/* ---------------- component ---------------- */
export default function OverridesInput(props: any) {
  const { value = [], onChange } = props as { value: OverrideItem[]; onChange: (patch: any) => void }

  // Self-heal missing _key once
  useEffect(() => {
    const needsKey = (value || []).some((it) => !it?._key)
    if (needsKey) onChange(set((value || []).map(withKey)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // UI state
  const [selected, setSelected] = useState<Date | undefined>(undefined)
  const [partialMode, setPartialMode] = useState(false)
  const [blocked, setBlocked] = useState<string[]>([])
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null)
  const [suppressPrefill, setSuppressPrefill] = useState(false)

  // NEW: which action is “active” in the confirm card for current selection
  // 'full' by default when a date is picked; becomes 'partial' when you click “Approve Partial”
  const [activeChoice, setActiveChoice] = useState<'full' | 'partial' | null>(null)

  // delete confirm modal
  const [confirmDelete, setConfirmDelete] = useState<null | { date: string }>(null)

  // Index by date
  const byDate = useMemo(() => {
    const map = new Map<string, OverrideItem>()
    for (const it of (value || [])) if (it?.date) map.set(it.date, it)
    return map
  }, [value])

  const ymd = selected ? ymdOf(selected) : undefined

  const upcoming = useMemo(() => {
    return (value || [])
      .filter((o) => o?.date && isTodayOrFuture(o.date))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [value])

  // Prefill on date change — DO NOT auto-open partial panel.
  useEffect(() => {
    if (!selected || suppressPrefill) return
    const ex = ymd ? byDate.get(ymd) : undefined

    // Default to “full” as active choice whenever a date is picked.
    // If there is an existing partial leave, we’ll reflect that choice visually
    // but keep the partial panel CLOSED until the user clicks “Approve Partial”.
    if (ex) {
      if (ex.isFullDay) {
        setPartialMode(false)
        setBlocked([])
        setActiveChoice('full')
      } else {
        setPartialMode(false)                 // <-- keep it closed
        setBlocked(ex.partialSlots || [])
        setActiveChoice('partial')            // <-- reflect existing choice without opening
      }
    } else {
      setPartialMode(false)
      setBlocked([])
      setActiveChoice('full')                 // <-- default active
    }
  }, [selected, ymd, byDate, suppressPrefill])

  // Selecting a date directly (we also ensure “full” is active by default)
  const handleSelectDate = (d?: Date) => {
    setSelected(d || undefined)
    setPartialMode(false)
    setBlocked([])
    if (d) setActiveChoice('full')
  }

  // Mutators
  const toggleSlot = (slot: string) => {
    setBlocked((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]))
  }

  const upsertOverride = (next: OverrideItem) => {
    const existing = (value || []).find((o) => o.date === next.date)
    const withStableKey = withKey({ ...next, _key: existing?._key })
    const dedup = (value || []).filter((o) => o.date !== next.date)
    onChange(set([...dedup, withStableKey]))
  }

  // Reset to initial (no date selected)
  const resetToInitial = () => {
    setSuppressPrefill(true)
    setPartialMode(false)
    setBlocked([])
    setSelected(undefined)
    // keep activeChoice as-is to “remember” the last action highlight (requested)
    setTimeout(() => setSuppressPrefill(false), 150)
  }

  const saveFullDay = () => {
    if (!ymd) return
    upsertOverride({ _type: 'appointmentOverride', date: ymd, isFullDay: true, partialSlots: [] })
    setRecentlyAdded(ymd)
    setActiveChoice('full')
    resetToInitial()
  }

  const approvePartial = () => {
    if (!ymd) return
    upsertOverride({ _type: 'appointmentOverride', date: ymd, isFullDay: false, partialSlots: blocked })
    setRecentlyAdded(ymd)
    setActiveChoice('partial')     // highlight shifts to “Approve Partial”
    resetToInitial()               // collapse + clear selection
  }

  const cancelPartial = () => {
    setPartialMode(false)
    // retain activeChoice as user intent; do not clear
  }

  const removeOverride = (date: string) => {
    onChange(set((value || []).filter((o: OverrideItem) => o.date !== date)))
    setConfirmDelete(null)
  }

  const editOverride = (o: OverrideItem) => {
    const dt = parseYMD(o.date)
    setSelected(dt)
    if (o.isFullDay) {
      setPartialMode(false)
      setBlocked([])
      setActiveChoice('full')
    } else {
      setPartialMode(true) // on explicit edit, open the panel
      setBlocked(o.partialSlots || [])
      setActiveChoice('partial')
    }
  }

  /* ---------- styling (glassy + teal) ---------- */
  const card = 'rounded-2xl border border-teal-400/20 bg-teal-400/10 backdrop-blur-md shadow-sm'
  const tile = 'rounded-xl border border-teal-400/20 bg-teal-400/10'
  const sectionPad = 'p-3 sm:p-4'
  const labelMuted = 'text-xs text-teal-50/80'

  // DayPicker compact
  const dpClass = 'rdp rdp-compact text-[13px] text-teal-50'
  const dpStyles = {
    root: { color: 'inherit' },
    caption: { fontWeight: 600 },
    months: { width: 280 },
    nav_button: { borderRadius: 8, padding: 4, lineHeight: 1 },
    day_button: { borderRadius: 10, height: 36, width: 36, transition: 'all 0.15s ease' },
    head_cell: { color: '#264E53', fontWeight: 600 },
    day_selected: { background: 'rgba(20,184,166,0.8)', color: '#fff', fontWeight: 600 },
    day_today: { outline: '2px solid rgba(20,184,166,0.45)', outlineOffset: 2, borderRadius: 10 },
  } as const

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4 text-teal-50">
      {/* Title */}
      <div className="text-lg font-semibold mb-1">Leave Application</div>

      {/* Top: Calendar (left) • Approved leaves (right, bounded width & scrollable) */}
      <div className={[card, sectionPad].join(' ')}>
        <div className="grid gap-6 md:[grid-template-columns:minmax(320px,_1fr)_minmax(220px,_320px)]">
          {/* Left: Calendar */}
          <div className="flex justify-center md:justify-start">
            <div className={[tile, 'p-2 inline-block'].join(' ')}>
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleSelectDate}
                className={dpClass}
                styles={dpStyles as any}
                disabled={{ before: new Date() }}
              />
            </div>
          </div>

          {/* Right: Approved leaves */}
          <div className="min-w-[220px] max-w-[320px] w-full md:justify-self-end">
            <div className="mb-2 flex items-center gap-2">
              <DotPulse />
              <div className="text-sm font-medium">Approved leaves</div>
              <span className={labelMuted}>({upcoming.length})</span>
            </div>

            {upcoming.length === 0 ? (
              <EmptyApprovedLeavesState />
            ) : (
              <div
                className={[
                  'grid gap-2',
                  'max-h-[360px] sm:max-h-[420px] md:max-h-[520px] overflow-auto pr-1',
                  '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-teal-400/30',
                ].join(' ')}
              >
                {upcoming.map((o) => {
                  const month = monthShort(parseYMD(o.date))
                  const day = parseYMD(o.date).getDate()
                  return (
                    <SlideIn key={o._key || o.date}>
                      <div
                        className={[
                          'flex items-center justify-between rounded-xl border border-teal-400/20 bg-teal-400/10 px-3 py-2',
                          'outline-none focus:outline-none'
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarTile month={month} day={day} compact />
                          <div className="text-xs text-teal-50/80">
                            {o.isFullDay ? 'Full day' : `${o.partialSlots?.length || 0} slots`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <IconButton ariaLabel="Edit" onClick={() => editOverride(o)} variant="teal">
                            <IconPencil />
                          </IconButton>
                          <IconButton ariaLabel="Delete" onClick={() => setConfirmDelete({ date: o.date })} variant="danger">
                            <IconX />
                          </IconButton>
                        </div>
                      </div>
                    </SlideIn>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm selection card – compact, iconic */}
      <div className={[card, sectionPad].join(' ')}>
        <div className="flex items-center gap-3">
          <CalendarTile
            month={ymd ? monthShort(parseYMD(ymd)) : monthShort(new Date())}
            day={ymd ? parseYMD(ymd).getDate() : new Date().getDate()}
          />
          <div>
            <div className="text-sm font-semibold">
              {ymd ? 'Confirm leave for selected date' : 'Pick a date to confirm leave'}
            </div>
            <div className={labelMuted}>Choose full-day or partial.</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FullWidthTealButton
            intent="primary"
            disabled={!ymd}
            label="Approve Full-day"
            onClick={saveFullDay}
            active={activeChoice === 'full'}
            ariaPressed={activeChoice === 'full'}
          />
          <FullWidthTealButton
            disabled={!ymd}
            label="Approve Partial"
            onClick={() => { setPartialMode(true); setActiveChoice('partial') }}
            active={activeChoice === 'partial'}
            ariaPressed={activeChoice === 'partial'}
          />
        </div>
      </div>

      {/* Partial slot picker */}
      {partialMode && (
        <div className={[card, sectionPad].join(' ')} aria-label="Partial leave selector">
          <div className="mb-2 flex items-center gap-2">
            <CalendarTile
              month={ymd ? monthShort(parseYMD(ymd)) : monthShort(new Date())}
              day={ymd ? parseYMD(ymd).getDate() : new Date().getDate()}
              compact
            />
            <div className="text-sm font-semibold">Select time slots</div>
          </div>

          <div className="rounded-xl border border-teal-400/25 bg-teal-400/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className={labelMuted}>Selected: {blocked.length}</div>
              <button
                type="button"
                onClick={() => setBlocked([])}
                className="text-[11px] px-2 py-1 rounded-md border border-teal-300/30 bg-teal-400/10 hover:bg-teal-400/20 transition outline-none focus:outline-none"
              >
                Clear
              </button>
            </div>
            <SlotGrid
              allSlots={SLOT_OPTIONS}
              selected={blocked}
              onToggle={toggleSlot}
              columns={4}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FullWidthTealButton
              intent="primary"
              disabled={!ymd || blocked.length === 0}
              label="Approve"
              onClick={approvePartial}
            />
            <FullWidthTealButton
              label="Cancel"
              onClick={cancelPartial}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation popup */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Cancel this leave?"
        description={confirmDelete ? formatPretty(confirmDelete.date) : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removeOverride(confirmDelete.date)}
      />

      {/* --- Calendar hover override for LIGHTER teal + dark teal text --- */}
      <style jsx global>{`
        /* Lighter hover wash with dark-teal text (only when not selected/disabled) */
        .rdp-day:not(.rdp-day_selected):not([disabled]):hover {
          background-color: rgba(20, 184, 166, 0.12) !important; /* lighter teal */
          color: #264e53 !important; /* dark teal text */
        }
        /* Ensure selected stays teal */
        .rdp-day_selected:not([disabled]) {
          background-color: rgba(20, 184, 166, 0.8) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  )
}

/* ---------------- tiny subcomponents ---------------- */

function CalendarTile({ month, day, compact = false }: { month: string, day: number, compact?: boolean }) {
  return (
    <div className={[
      'relative rounded-lg border border-teal-300/30 bg-teal-500/15 grid place-items-center',
      compact ? 'h-9 w-9' : 'h-10 w-10'
    ].join(' ')}>
      <div className={[
        'absolute top-0 left-1/2 -translate-x-1/2 rounded-b-md bg-teal-400/40',
        compact ? 'h-1.5 w-7' : 'h-2 w-8'
      ].join(' ')} />
      <div className="text-[9px] leading-none text-teal-100 mt-1">{month}</div>
      <div className={['font-bold text-white', compact ? 'text-xs -mt-0.5' : 'text-sm -mt-0.5'].join(' ')}>{day}</div>
    </div>
  )
}

function EmptyApprovedLeavesState() {
  return (
    <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4">
      <div className="flex items-center gap-3">
        <MiniPalmTree />
        <div>
          <div className="text-sm font-semibold text-teal-50">No upcoming leaves</div>
          <div className="text-xs text-teal-50/80">Pick a date on the left and confirm below.</div>
        </div>
      </div>
    </div>
  )
}

function MiniPalmTree() {
  return (
    <div className="relative h-12 w-12">
      <svg className="absolute -top-1 -right-1 h-4 w-4 animate-pulse opacity-90" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" className="fill-teal-200/80" />
        <g className="stroke-teal-200/80" strokeWidth="1.5">
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"/>
        </g>
      </svg>
      <svg viewBox="0 0 64 64" className="h-12 w-12">
        <g className="origin-bottom animate-[floatPalm_3s_ease-in-out_infinite]">
          <defs>
            <linearGradient id="palm" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(20,184,166,0.9)" />
              <stop offset="100%" stopColor="rgba(20,184,166,0.6)" />
            </linearGradient>
          </defs>
          <path d="M34 52c0-8 4-14 4-22" stroke="url(#palm)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M36 28c6-4 12-4 18 0-6 2-12 2-18 0Z" fill="url(#palm)"/>
          <path d="M36 28c-6-4-12-4-18 0 6 2 12 2 18 0Z" fill="url(#palm)"/>
          <path d="M36 28c8-2 14-6 16-12-6 2-10 6-16 12Z" fill="url(#palm)"/>
          <path d="M36 28c-8-2-14-6-16-12 6 2 10 6 16 12Z" fill="url(#palm)"/>
        </g>
        <ellipse cx="28" cy="54" rx="14" ry="3" className="fill-teal-300/20" />
      </svg>
      <style jsx>{`
        @keyframes floatPalm {
          0%, 100% { transform: translateY(0px) }
          50% { transform: translateY(-2px) }
        }
      `}</style>
    </div>
  )
}

function SlideIn({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div
      className={[
        'transition-all duration-300',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/* ------------- icons, buttons & dialog ------------- */
function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-teal-100" fill="none" strokeWidth="1.8">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" />
      <path d="M14.06 6.19l3.75 3.75" />
    </svg>
  )
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-red-200" fill="none" strokeWidth="2">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  )
}

function IconButton({
  children,
  onClick,
  ariaLabel,
  variant = 'teal',
}: {
  children: React.ReactNode
  onClick: () => void
  ariaLabel: string
  variant?: 'teal' | 'danger'
}) {
  const tone =
    variant === 'danger'
      ? 'border-red-400/40 bg-red-500/15 hover:bg-red-500/25'
      : 'border-teal-300/30 bg-teal-400/15 hover:bg-teal-400/25'
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'h-8 w-8 grid place-items-center rounded-lg border transition-all',
        'active:scale-[0.96] outline-none focus:outline-none',
        tone,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-teal-300/20 bg-neutral-900 text-teal-50 shadow-lg">
          <div className="p-4">
            <div className="text-sm font-semibold">{title}</div>
            {description ? (
              <div className="mt-1 text-xs text-teal-50/80">{description}</div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-teal-300/30 bg-teal-400/15 hover:bg-teal-400/25 transition outline-none focus:outline-none"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-red-400/40 bg-red-500/20 hover:bg-red-500/30 text-red-50 transition outline-none focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FullWidthTealButton({
  label,
  onClick,
  intent = 'neutral',
  disabled = false,
  active = false,
  ariaPressed,
}: {
  label: string
  onClick: () => void
  intent?: 'neutral' | 'primary'
  disabled?: boolean
  active?: boolean
  ariaPressed?: boolean
}) {
  const base =
    intent === 'primary'
      ? 'bg-teal-500/80 hover:bg-teal-500 text-white border-teal-300/40'
      : 'bg-teal-400/15 hover:bg-teal-400/25 text-teal-50 border-teal-300/30'
  const activeStyles = 'ring-2 ring-teal-300/50 bg-teal-500/40 text-white border-teal-300/40'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      className={[
        'w-full text-sm font-semibold px-3 py-2 rounded-lg border transition',
        'active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed',
        'outline-none focus:outline-none',
        base,
        active ? activeStyles : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function DotPulse() {
  return (
    <span className="relative inline-block h-2 w-2">
      <span className="absolute inset-0 rounded-full bg-teal-100"></span>
      <span className="absolute inset-0 rounded-full bg-teal-200 animate-ping"></span>
    </span>
  )
}

/* -------- helpers -------- */
function formatPretty(s: string) {
  const d = parseYMD(s)
  const day = d.getDate()
  const mon = d.toLocaleString(undefined, { month: 'short' })
  const y = d.getFullYear()
  return `${mon} ${day}, ${y}`
}