// sanity/components/WeeklySlotInput.tsx
import React from 'react'
import { set, unset } from 'sanity'

// slots 08:00 → 23:00
const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = 8 + i
  return `${h.toString().padStart(2, '0')}:00`
})

export default function WeeklySlotInput(props: any) {
  const { value = [], onChange } = props

  const toggle = (slot: string) => {
    if (value.includes(slot)) {
      onChange(set(value.filter((s: string) => s !== slot)))
    } else {
      onChange(set([...value, slot]))
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {SLOT_OPTIONS.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => toggle(slot)}
          className={[
            'px-2 py-1 rounded-md text-sm border transition',
            value.includes(slot)
              ? 'bg-teal-600 text-white border-teal-700'
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100',
          ].join(' ')}
        >
          {slot}
        </button>
      ))}
    </div>
  )
}