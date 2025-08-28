// /Users/albert/Desktop/github_repos/pediahelp/sanity/components/WeeklyAvailabilityInput.tsx
'use client'

import React, { useMemo, useState } from 'react'
import { set } from 'sanity'
import SlotGrid from './SlotGrid'
import { SLOT_OPTIONS } from '../schemas/objects/weeklyAvailability'

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const

type DayKey = typeof DAYS[number]['key']
type WeeklyValue = Partial<Record<DayKey, string[]>> & { _type?: 'weeklyAvailability' }

export default function WeeklyAvailabilityInput(props: any) {
  const { value, onChange } = props
  const [active, setActive] = useState<DayKey>('monday')

  const safeValue: WeeklyValue = useMemo(() => {
    const base: WeeklyValue = { _type: 'weeklyAvailability' }
    for (const d of DAYS) base[d.key] = Array.isArray(value?.[d.key]) ? value[d.key] : []
    return { ...base, ...(value || {}) }
  }, [value])

  const updateDay = (dayKey: DayKey, slots: string[]) => {
    onChange(set({ ...safeValue, _type: 'weeklyAvailability', [dayKey]: slots }))
  }

  const toggle = (slot: string) => {
    const current = safeValue[active] || []
    const next = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot]
    updateDay(active, next)
  }

  const selectAll = () => updateDay(active, SLOT_OPTIONS.slice())
  const clearAll = () => updateDay(active, [])
  const copyToAllDays = () => {
    const from = safeValue[active] || []
    const next: WeeklyValue = { _type: 'weeklyAvailability' }
    for (const d of DAYS) next[d.key] = from.slice()
    onChange(set(next))
  }

  return (
    <div className="space-y-3">
      {/* FULL-WIDTH Day Tabs */}
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-sm overflow-hidden">
        <div
          className="
            grid grid-cols-7
            divide-x divide-white/10
          "
          role="tablist"
          aria-label="Select weekday"
        >
          {DAYS.map((d) => {
            const is = d.key === active
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={is}
                onClick={() => setActive(d.key)}
                className={[
                  'w-full px-3 py-2.5 text-sm font-medium transition-all select-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                  is
                    ? 'bg-white/25 text-white shadow-inner'
                    : 'text-gray-200 hover:bg-white/10 active:scale-[0.98]',
                ].join(' ')}
              >
                <span className={is ? 'opacity-100' : 'opacity-90'}>{d.label}</span>
              </button>
            )
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-white/10 bg-white/5">
          <ActionButton label="Select all slots" onClick={selectAll} />
          <ActionButton label="Clear all slots" onClick={clearAll} />
          <ActionButton
            label="Copy to all days"
            onClick={copyToAllDays}
            intent="primary"
          />
          <span className="ml-auto text-xs text-white/70">
            {safeValue[active]?.length || 0} selected
          </span>
        </div>
      </div>

      {/* Slot Grid */}
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-sm p-3">
        <SlotGrid
          allSlots={SLOT_OPTIONS}
          selected={safeValue[active] || []}
          onToggle={toggle}
          columns={4}
        />
      </div>
    </div>
  )
}

/** Small animated glassy button with hierarchy support */
function ActionButton({
  label,
  onClick,
  intent = 'neutral',
}: {
  label: string
  onClick: () => void
  intent?: 'neutral' | 'primary'
}) {
  const classes =
    intent === 'primary'
      ? 'bg-white/25 hover:bg-white/30 text-white border-white/30'
      : 'bg-white/10 hover:bg-white/20 text-gray-100 border-white/20'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-md text-xs font-semibold border',
        'transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        'shadow-sm',
        classes,
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1">
        <DotPulse />
        {label}
      </span>
    </button>
  )
}

/** Tiny dot with gentle pulse for “live” feel without extra deps */
function DotPulse() {
  return (
    <span className="relative inline-block h-2 w-2">
      <span className="absolute inset-0 rounded-full bg-white/80"></span>
      <span className="absolute inset-0 rounded-full bg-white/60 animate-ping"></span>
    </span>
  )
}