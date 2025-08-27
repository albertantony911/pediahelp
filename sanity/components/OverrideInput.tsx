// sanity/components/OverrideInput.tsx
import React from 'react'
import { set } from 'sanity'

const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = 8 + i
  return `${h.toString().padStart(2, '0')}:00`
})

export default function OverrideInput(props: any) {
  const { value = {}, onChange } = props

  const update = (field: string, newVal: any) => {
    onChange(set({ ...value, [field]: newVal }))
  }

  const toggleSlot = (slot: string) => {
    const current = value.partialSlots || []
    if (current.includes(slot)) {
      update('partialSlots', current.filter((s: string) => s !== slot))
    } else {
      update('partialSlots', [...current, slot])
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium">Date</span>
        <input
          type="date"
          value={value.date || ''}
          onChange={(e) => update('date', e.target.value)}
          className="mt-1 block w-full rounded-md border px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!value.isFullDay}
          onChange={(e) => update('isFullDay', e.target.checked)}
        />
        <span>Full day leave</span>
      </label>

      {!value.isFullDay && (
        <div>
          <p className="text-xs mb-1">Unavailable slots:</p>
          <div className="grid grid-cols-4 gap-2">
            {SLOT_OPTIONS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={[
                  'px-2 py-1 rounded-md text-sm border transition',
                  value.partialSlots?.includes(slot)
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100',
                ].join(' ')}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}