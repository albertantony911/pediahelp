// /Users/albert/Desktop/github_repos/pediahelp/sanity/components/SlotGrid.tsx
'use client'

import React from 'react'

type Props = {
  allSlots: string[]
  selected: string[]
  onToggle: (slot: string) => void
  columns?: number
}

export default function SlotGrid({ allSlots, selected, onToggle, columns = 4 }: Props) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {allSlots.map((slot) => {
        const isOn = selected.includes(slot)
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onToggle(slot)}
            className={[
              'px-3 py-2 rounded-md text-xs font-medium border transition',
              isOn
                ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                : 'bg-white/80 text-gray-700 border-gray-300 hover:bg-gray-50'
            ].join(' ')}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}